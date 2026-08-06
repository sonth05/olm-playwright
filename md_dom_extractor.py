"""
Tool lọc dữ liệu chính xác từ file .md chứa nhiều đoạn HTML lẫn lộn (bản v2).

So với bản gốc, bản này:
  1. Tìm khối HTML chính xác hơn: nhận diện cả fence ``` và ~~~, ghi lại
     số dòng bắt đầu/kết thúc của từng khối trong file gốc (để dễ tra ngược).
  2. Selector có thể gắn NHÃN (label) mô tả rõ ý nghĩa dữ liệu, ví dụ:
        -s "h1::Tieu_de" ".price::Gia" "a.btn::Link_nut_bam::href"
     cú pháp:  selector[::label[::attribute]]
     - label: tên cột hiển thị trong kết quả (mặc định = chính selector)
     - attribute: nếu muốn lấy thuộc tính riêng cho selector này (ghi đè -a)
  3. Mỗi phần tử trích ra không chỉ có "value" mà còn có ngữ cảnh:
     tag name, id, class, toàn bộ attrs, text, html rút gọn, vị trí
     (block_index, element_index) → giúp trả lời "chính xác lấy từ đâu".
  4. Có thể trích nhiều attribute cùng lúc (-a text html href src ...).
  5. Tuỳ chọn khử trùng lặp (--dedupe) theo text.
  6. Tuỳ chọn quét cả HTML nằm ngoài code block (--include-raw) cho các
     file .md nhúng HTML trực tiếp không bọc trong ```...```.
  7. Xuất JSON / CSV / Markdown (bảng), kèm phần tổng kết số liệu theo
     từng selector để kiểm tra nhanh độ chính xác.

Cách dùng cơ bản (giữ tương thích ngược với bản cũ):
    python md_dom_extractor_v2.py input.md -s "h1" ".title" "a[href]" -o result.json

Cách dùng nâng cao (có nhãn + attribute riêng + khử trùng lặp):
    python md_dom_extractor_v2.py input.md \\
        -s "h1::Tieu_de_bai" \\
           ".price::Gia_tien" \\
           "a.download-btn::Link_tai_ve::href" \\
        -a text \\
        --dedupe \\
        --include-raw \\
        -o result.json -v
"""

import re
import argparse
import json
import csv
import sys
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import List, Dict, Optional

from bs4 import BeautifulSoup


# --------------------------------------------------------------------------- #
# 1. Tìm khối HTML trong markdown (chính xác hơn: có số dòng, nhiều loại fence)
# --------------------------------------------------------------------------- #

@dataclass
class HtmlBlock:
    index: int
    content: str
    start_line: int
    end_line: int
    fence: str          # "```" hoặc "~~~"
    lang_hint: str       # ngôn ngữ khai báo sau fence, vd "html", "" nếu không có
    source: str = "fenced"  # "fenced" hoặc "raw"


def _iter_fenced_blocks(md_content: str):
    """
    Duyệt toàn bộ file theo dòng để bắt cặp fence mở/đóng chính xác
    (```/~~~), tránh việc regex .*? nuốt nhầm qua nhiều khối liền nhau.
    """
    lines = md_content.splitlines()
    i = 0
    fence_re = re.compile(r"^(\s*)(```|~~~)([\w+-]*)\s*$")
    while i < len(lines):
        m = fence_re.match(lines[i])
        if m:
            fence = m.group(2)
            lang_hint = m.group(3).lower()
            start_line = i + 1  # 1-based, dòng chứa fence mở
            body = []
            j = i + 1
            closed = False
            while j < len(lines):
                close_m = fence_re.match(lines[j])
                if close_m and close_m.group(2) == fence:
                    closed = True
                    break
                body.append(lines[j])
                j += 1
            end_line = j + 1 if closed else j  # dòng chứa fence đóng (nếu có)
            yield fence, lang_hint, "\n".join(body), start_line, end_line
            i = j + 1 if closed else j + 1
        else:
            i += 1


def extract_html_blocks(md_content: str, include_raw: bool = False) -> List[HtmlBlock]:
    """
    Trả về danh sách HtmlBlock, mỗi block biết chính xác nó nằm ở dòng nào
    trong file .md gốc.

    - Ưu tiên các khối fence khai báo rõ ```html.
    - Nếu không khai báo ngôn ngữ, vẫn nhận nếu nội dung có dấu hiệu HTML
      (thẻ mở dạng <tag ...>).
    - include_raw=True: quét thêm những đoạn HTML nằm trực tiếp ngoài
      fence (không được bọc ```), dựa trên các thẻ khối phổ biến.
    """
    blocks: List[HtmlBlock] = []
    tag_signal = re.compile(r"<\s*[a-zA-Z][\w:-]*[^>]*>")

    idx = 0
    consumed_spans = []  # (start_line, end_line) của các khối fenced, để include_raw không quét trùng
    for fence, lang_hint, body, start_line, end_line in _iter_fenced_blocks(md_content):
        looks_like_html = lang_hint in ("html", "htm") or bool(tag_signal.search(body))
        if looks_like_html and body.strip():
            blocks.append(HtmlBlock(
                index=idx, content=body, start_line=start_line,
                end_line=end_line, fence=fence, lang_hint=lang_hint, source="fenced",
            ))
            idx += 1
        consumed_spans.append((start_line, end_line))

    if include_raw:
        lines = md_content.splitlines()
        in_fence = [False] * (len(lines) + 2)
        for s, e in consumed_spans:
            for ln in range(s, min(e, len(lines)) + 1):
                if 1 <= ln <= len(lines):
                    in_fence[ln] = True

        raw_candidate = []
        raw_start = None
        for ln_no, line in enumerate(lines, start=1):
            if in_fence[ln_no]:
                if raw_candidate:
                    joined = "\n".join(raw_candidate)
                    if tag_signal.search(joined):
                        blocks.append(HtmlBlock(
                            index=idx, content=joined, start_line=raw_start,
                            end_line=ln_no - 1, fence="", lang_hint="", source="raw",
                        ))
                        idx += 1
                    raw_candidate, raw_start = [], None
                continue
            if tag_signal.search(line):
                if raw_start is None:
                    raw_start = ln_no
                raw_candidate.append(line)
            else:
                if raw_candidate:
                    joined = "\n".join(raw_candidate)
                    blocks.append(HtmlBlock(
                        index=idx, content=joined, start_line=raw_start,
                        end_line=ln_no - 1, fence="", lang_hint="", source="raw",
                    ))
                    idx += 1
                raw_candidate, raw_start = [], None
        if raw_candidate:
            joined = "\n".join(raw_candidate)
            blocks.append(HtmlBlock(
                index=idx, content=joined, start_line=raw_start,
                end_line=len(lines), fence="", lang_hint="", source="raw",
            ))
            idx += 1

    return blocks


# --------------------------------------------------------------------------- #
# 2. Selector có nhãn: "selector::label::attribute"
# --------------------------------------------------------------------------- #

@dataclass
class SelectorSpec:
    css: str
    label: str
    attribute: Optional[str] = None  # None nghĩa là dùng attribute mặc định (-a)


def parse_selector_specs(raw_selectors: List[str]) -> List[SelectorSpec]:
    specs = []
    for raw in raw_selectors:
        parts = raw.split("::")
        css = parts[0].strip()
        label = parts[1].strip() if len(parts) > 1 and parts[1].strip() else css
        attribute = parts[2].strip() if len(parts) > 2 and parts[2].strip() else None
        specs.append(SelectorSpec(css=css, label=label, attribute=attribute))
    return specs


# --------------------------------------------------------------------------- #
# 3. Trích xuất chi tiết từng phần tử (không chỉ 1 giá trị, mà cả ngữ cảnh)
# --------------------------------------------------------------------------- #

@dataclass
class ExtractedElement:
    block_index: int
    block_source: str
    md_line_range: str
    selector: str
    label: str
    element_index: int
    tag: str
    id: Optional[str]
    classes: List[str]
    attrs: Dict[str, object]
    text: str
    html_snippet: str
    value: object  # giá trị chính theo attribute yêu cầu (text/html/href/...)


def _get_value(el, attribute: str):
    if attribute == "text":
        return el.get_text(strip=True)
    if attribute == "html":
        return str(el)
    return el.get(attribute, "")


def parse_and_extract(
    html_content: str,
    specs: List[SelectorSpec],
    default_attributes: List[str],
    html_snippet_len: int = 160,
) -> List[ExtractedElement]:
    soup = BeautifulSoup(html_content, "html.parser")
    results: List[ExtractedElement] = []

    for spec in specs:
        try:
            elements = soup.select(spec.css)
        except Exception as e:
            print(f"  ⚠️  Selector không hợp lệ '{spec.css}': {e}", file=sys.stderr)
            continue

        attrs_to_pull = [spec.attribute] if spec.attribute else default_attributes

        for el_idx, el in enumerate(elements):
            html_str = str(el)
            snippet = html_str if len(html_str) <= html_snippet_len else html_str[:html_snippet_len] + "…"
            classes = el.get("class", []) if hasattr(el, "get") else []

            for attribute in attrs_to_pull:
                value = _get_value(el, attribute)
                results.append(ExtractedElement(
                    block_index=-1,       # được gán lại ở main()
                    block_source="",      # được gán lại ở main()
                    md_line_range="",     # được gán lại ở main()
                    selector=spec.css,
                    label=spec.label,
                    element_index=el_idx,
                    tag=el.name if hasattr(el, "name") else "",
                    id=el.get("id") if hasattr(el, "get") else None,
                    classes=classes,
                    attrs=dict(el.attrs) if hasattr(el, "attrs") else {},
                    text=el.get_text(strip=True) if hasattr(el, "get_text") else "",
                    html_snippet=snippet,
                    value=value,
                ))
    return results


# --------------------------------------------------------------------------- #
# 4. Xuất kết quả
# --------------------------------------------------------------------------- #

def dedupe_results(rows: List[ExtractedElement]) -> List[ExtractedElement]:
    seen = set()
    out = []
    for r in rows:
        key = (r.label, r.value if not isinstance(r.value, (list, dict)) else str(r.value))
        if key in seen:
            continue
        seen.add(key)
        out.append(r)
    return out


def write_json(rows: List[ExtractedElement], out_path: Path):
    with out_path.open("w", encoding="utf-8") as f:
        json.dump([asdict(r) for r in rows], f, ensure_ascii=False, indent=2)


def write_csv(rows: List[ExtractedElement], out_path: Path):
    fieldnames = [
        "block_index", "block_source", "md_line_range", "selector", "label",
        "element_index", "tag", "id", "classes", "text", "value", "html_snippet",
    ]
    with out_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for r in rows:
            d = asdict(r)
            d["classes"] = " ".join(r.classes) if r.classes else ""
            writer.writerow({k: d.get(k, "") for k in fieldnames})


def write_markdown_table(rows: List[ExtractedElement], out_path: Path):
    header = "| Block | Dòng MD | Label | Selector | Tag | Text/Value |\n"
    sep = "|---|---|---|---|---|---|\n"
    lines = [header, sep]
    for r in rows:
        val = str(r.value).replace("|", "\\|").replace("\n", " ")
        if len(val) > 80:
            val = val[:80] + "…"
        lines.append(
            f"| {r.block_index} | {r.md_line_range} | {r.label} | `{r.selector}` | "
            f"{r.tag} | {val} |\n"
        )
    with out_path.open("w", encoding="utf-8") as f:
        f.writelines(lines)


# --------------------------------------------------------------------------- #
# 5. CLI chính
# --------------------------------------------------------------------------- #

def main():
    parser = argparse.ArgumentParser(
        description="Trích xuất dữ liệu chính xác từ các đoạn HTML trong file Markdown (bản v2).",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("input_file", help="Đường dẫn file .md chứa DOM")
    parser.add_argument(
        "-s", "--selectors", nargs="+", required=True,
        help=(
            "Danh sách CSS selector, hỗ trợ cú pháp "
            "'selector::label::attribute'. VD: 'h1::Tieu_de' '.price::Gia::text'"
        ),
    )
    parser.add_argument(
        "-a", "--attributes", nargs="+", default=["text"],
        help="Danh sách thuộc tính mặc định cần lấy nếu selector không tự khai báo "
             "(vd: text html href src). Mặc định: text",
    )
    parser.add_argument("-o", "--output", help="File xuất kết quả (.json, .csv hoặc .md)")
    parser.add_argument(
        "--include-raw", action="store_true",
        help="Quét thêm HTML nằm ngoài code block (không bọc ```...```)",
    )
    parser.add_argument(
        "--dedupe", action="store_true",
        help="Loại bỏ kết quả trùng lặp (theo cặp label+value)",
    )
    parser.add_argument(
        "--snippet-len", type=int, default=160,
        help="Độ dài tối đa của html_snippet hiển thị/lưu (mặc định 160 ký tự)",
    )
    parser.add_argument("-v", "--verbose", action="store_true", help="In chi tiết từng phần tử tìm được")
    args = parser.parse_args()

    md_path = Path(args.input_file)
    if not md_path.exists():
        print(f"❌ File {md_path} không tồn tại.")
        return
    try:
        md_content = md_path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        print("⚠️ File không phải UTF-8, thử đọc lại với encoding utf-8-sig...")
        md_content = md_path.read_text(encoding="utf-8-sig")

    specs = parse_selector_specs(args.selectors)

    html_blocks = extract_html_blocks(md_content, include_raw=args.include_raw)
    if not html_blocks:
        print("⚠️ Không tìm thấy khối HTML nào trong file.")
        return

    print(f"📄 Tìm thấy {len(html_blocks)} khối HTML "
          f"({sum(1 for b in html_blocks if b.source == 'fenced')} trong code block, "
          f"{sum(1 for b in html_blocks if b.source == 'raw')} HTML thô).")

    all_rows: List[ExtractedElement] = []
    for block in html_blocks:
        print(f"\n=== Khối #{block.index} · dòng {block.start_line}-{block.end_line} "
              f"· nguồn: {block.source} · độ dài: {len(block.content)} ký tự ===")
        try:
            rows = parse_and_extract(block.content, specs, args.attributes, args.snippet_len)
        except Exception as e:
            print(f"❌ Lỗi parse khối #{block.index}: {e}")
            continue

        for r in rows:
            r.block_index = block.index
            r.block_source = block.source
            r.md_line_range = f"{block.start_line}-{block.end_line}"
        all_rows.extend(rows)

        by_selector: Dict[str, int] = {}
        for r in rows:
            by_selector[r.label] = by_selector.get(r.label, 0) + 1
        for label, count in by_selector.items():
            print(f"🔹 {label}: {count} phần tử")
            if args.verbose:
                shown = 0
                for r in rows:
                    if r.label == label:
                        print(f"   [{r.element_index}] <{r.tag} id={r.id!r} class={r.classes}> "
                              f"→ {str(r.value)[:100]!r}")
                        shown += 1
                        if shown >= 5:
                            remaining = count - shown
                            if remaining > 0:
                                print(f"   ... và {remaining} kết quả khác.")
                            break

    if args.dedupe:
        before = len(all_rows)
        all_rows = dedupe_results(all_rows)
        print(f"\n🧹 Đã khử trùng lặp: {before} → {len(all_rows)} phần tử.")

    print(f"\n📊 Tổng cộng: {len(all_rows)} phần tử được trích xuất "
          f"từ {len(html_blocks)} khối, {len(specs)} selector.")

    if args.output:
        out_path = Path(args.output)
        suffix = out_path.suffix.lower()
        if suffix == ".json":
            write_json(all_rows, out_path)
        elif suffix == ".csv":
            write_csv(all_rows, out_path)
        elif suffix == ".md":
            write_markdown_table(all_rows, out_path)
        else:
            print("⚠️ Định dạng output không được hỗ trợ (chỉ .json, .csv hoặc .md)")
            return
        print(f"✅ Đã lưu kết quả vào {out_path}")


if __name__ == "__main__":
    main()