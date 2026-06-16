đây là đoạn code lấy các element được trích xuất ra từ trang web bằng cách gán vào console 



// Tổng hợp tất cả yếu tố của trang - FIXED
const pageElements = {
  // 1. Tiêu đề trang
  title: document.title,
  
  // 2. Tất cả heading
  headings: Array.from(document.querySelectorAll('h1, h2, h3')).map(el => ({
    tag: el.tagName,
    text: el.textContent.trim(),
    class: el.className,
    id: el.id
  })),

  // 3. Tất cả form
  forms: Array.from(document.querySelectorAll('form')).map(form => ({
    id: form.id,
    name: form.name,
    action: form.action,
    method: form.method,
    inputs: Array.from(form.querySelectorAll('input, textarea, select')).map(input => ({
      type: input.type,
      name: input.name,
      placeholder: input.placeholder,
      id: input.id
    }))
  })),

  // 4. Tất cả button
  buttons: Array.from(document.querySelectorAll('button')).map(btn => ({
    text: btn.textContent.trim(),
    id: btn.id,
    class: btn.className,
    onclick: btn.onclick ? 'có' : 'không'
  })),

  // 5. Tất cả link
  links: Array.from(document.querySelectorAll('a')).map(link => ({
    text: link.textContent.trim(),
    href: link.href,
    class: link.className
  })).slice(0, 20),

  // 6. Tất cả ID trên trang
  allIds: Array.from(document.querySelectorAll('[id]')).map(el => ({
    id: el.id,
    tag: el.tagName,
    class: el.className
  })),

  // 7. Tất cả Class
  allClasses: [...new Set(Array.from(document.querySelectorAll('[class]')).map(el => el.className))].slice(0, 30),

  // 8. JavaScript functions có sẵn
  globalFunctions: Object.keys(window).filter(key => typeof window[key] === 'function').slice(0, 20),

  // 9. Data attributes - FIX
  dataAttributes: Array.from(document.querySelectorAll('*')).filter(el => {
    return Object.keys(el.dataset).length > 0;
  }).map(el => ({
    tag: el.tagName,
    data: el.dataset
  })).slice(0, 10),

  // 10. Nav menu
  navMenu: Array.from(document.querySelectorAll('nav a, .menu a')).map(link => ({
    text: link.textContent.trim(),
    href: link.href
  }))
};

console.table(pageElements);
console.log(pageElements); // Log đầy đủ
