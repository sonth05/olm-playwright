import { BasePage } from '@core/shared-pages/BasePage';
import type { Locator, Page } from '@playwright/test';

/**
 * Page Object — Thảo luận trong trường (1.7).
 * Quản lý các cuộc thảo luận, bình luận, và tương tác cộng đồng trường.
 */
export class ThaoLuanTruongPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // ── Selectors ──────────────────────────────────────────────────────────────

  private get discussionList(): Locator {
    return this.page.locator('[data-testid="discussion-list"], .discussion-list');
  }

  private get discussionPosts(): Locator {
    return this.discussionList.locator('[data-testid="discussion-post"], .post-item');
  }

  private get createDiscussionButton(): Locator {
    return this.page.locator('button:has-text("Tạo thảo luận"), button:has-text("Bắt đầu thảo luận"), [data-action="create-discussion"]');
  }

  private get createPostModal(): Locator {
    return this.page.locator('[data-testid="create-discussion-modal"], .create-post-modal');
  }

  private get postTitleInput(): Locator {
    return this.createPostModal.locator('input[name="title"], input[placeholder*="Tiêu đề"]');
  }

  private get postContentInput(): Locator {
    return this.createPostModal.locator('textarea[name="content"], textarea[placeholder*="Nội dung"]');
  }

  private get postCategorySelect(): Locator {
    return this.createPostModal.locator('select[name="category"], [data-testid="category-select"]');
  }

  private get postSubmitButton(): Locator {
    return this.createPostModal.locator('button[type="submit"], button:has-text("Đăng bài")');
  }

  private get postCancelButton(): Locator {
    return this.createPostModal.locator('button:has-text("Hủy"), [data-action="cancel"]');
  }

  private get filterButton(): Locator {
    return this.page.locator('button:has-text("Lọc"), [data-testid="filter-button"]');
  }

  private get sortButton(): Locator {
    return this.page.locator('button:has-text("Sắp xếp"), select[name="sort"]');
  }

  private get searchInput(): Locator {
    return this.page.locator('input[placeholder*="Tìm kiếm"], input[type="search"]');
  }

  private get categoryFilter(): Locator {
    return this.page.locator('select[name="category-filter"], [data-testid="category-filter"]');
  }

  private get noDiscussionsMessage(): Locator {
    return this.page.locator('text="Chưa có thảo luận nào", text="Không có bài viết"');
  }

  private get loadingIndicator(): Locator {
    return this.page.locator('[data-testid="loading"], .spinner, .loading');
  }

  private get emptyState(): Locator {
    return this.discussionList.locator('.empty-state, [data-testid="empty-state"]');
  }

  // ── Comment selectors ──────────────────────────────────────────────────────

  private get commentSection(): Locator {
    return this.page.locator('[data-testid="comment-section"], .comments-section');
  }

  private get commentList(): Locator {
    return this.commentSection.locator('[data-testid="comment"], .comment-item');
  }

  private get commentInput(): Locator {
    return this.commentSection.locator('textarea[name="comment"], input[placeholder*="Bình luận"]');
  }

  private get commentSubmitButton(): Locator {
    return this.commentSection.locator('button[type="submit"], button:has-text("Gửi")');
  }

  // ── Engagement selectors ───────────────────────────────────────────────────

  private getLikeButton(postId: string): Locator {
    return this.page.locator(`[data-post-id="${postId}"] [data-action="like"], button:has-text("Thích")`);
  }

  private getReplyButton(postId: string): Locator {
    return this.page.locator(`[data-post-id="${postId}"] [data-action="reply"], button:has-text("Trả lời")`);
  }

  private getShareButton(postId: string): Locator {
    return this.page.locator(`[data-post-id="${postId}"] [data-action="share"], button:has-text("Chia sẻ")`);
  }

  private getDeleteButton(postId: string): Locator {
    return this.page.locator(`[data-post-id="${postId}"] [data-action="delete"], button:has-text("Xóa")`);
  }

  private getEditButton(postId: string): Locator {
    return this.page.locator(`[data-post-id="${postId}"] [data-action="edit"], button:has-text("Chỉnh sửa")`);
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  /**
   * Open the Thảo luận trong trường page.
   * URL path: /truong-hoc/{school_id}/thao-luan-truong
   */
  async open(schoolId: string): Promise<void> {
    await this.navigateTo(`/truong-hoc/${schoolId}/thao-luan-truong`);
    await this.page.waitForTimeout(1_000);
  }

  /**
   * Wait for discussion list to load.
   */
  async waitForDiscussionListLoad(timeoutMs = 8_000): Promise<boolean> {
    try {
      // Wait for either discussions to load or empty state to appear
      await Promise.race([
        this.discussionPosts.first().waitFor({ state: 'attached', timeout: timeoutMs }),
        this.emptyState.waitFor({ state: 'visible', timeout: timeoutMs }),
      ]);
      return true;
    } catch {
      return false;
    }
  }

  // ── Create Discussion ──────────────────────────────────────────────────────

  /**
   * Click button to open create discussion modal.
   */
  async openCreateDiscussionModal(): Promise<void> {
    await this.jsClick(this.createDiscussionButton);
    await this.page.waitForTimeout(500);
  }

  /**
   * Check if create discussion modal is open.
   */
  async isCreateModalOpen(): Promise<boolean> {
    try {
      return await this.createPostModal.isVisible({ timeout: 2_000 });
    } catch {
      return false;
    }
  }

  /**
   * Enter discussion title in the create modal.
   */
  async enterPostTitle(title: string): Promise<void> {
    await this.jsClearAndType(this.postTitleInput, title);
  }

  /**
   * Enter discussion content in the create modal.
   */
  async enterPostContent(content: string): Promise<void> {
    await this.jsClearAndType(this.postContentInput, content);
  }

  /**
   * Select a category for the discussion.
   */
  async selectPostCategory(categoryName: string): Promise<void> {
    const select = this.postCategorySelect;
    if (await select.isVisible()) {
      await select.selectOption(categoryName);
      await this.page.waitForTimeout(300);
    }
  }

  /**
   * Get available categories for discussion.
   */
  async getAvailableCategories(): Promise<string[]> {
    const options = await this.postCategorySelect.locator('option').all();
    const categories: string[] = [];
    for (const opt of options) {
      const text = await opt.textContent();
      if (text && text.trim()) categories.push(text.trim());
    }
    return categories;
  }

  /**
   * Submit the discussion post.
   */
  async submitPost(): Promise<void> {
    await this.jsClick(this.postSubmitButton);
    await this.page.waitForTimeout(1_000);
  }

  /**
   * Cancel creating post and close modal.
   */
  async cancelPost(): Promise<void> {
    await this.jsClick(this.postCancelButton);
    await this.page.waitForTimeout(500);
  }

  /**
   * Create and submit a new discussion.
   */
  async createNewDiscussion(
    title: string,
    content: string,
    category?: string
  ): Promise<void> {
    await this.openCreateDiscussionModal();
    await this.enterPostTitle(title);
    await this.enterPostContent(content);
    if (category) {
      await this.selectPostCategory(category);
    }
    await this.submitPost();
  }

  // ── Discussion List & Search ───────────────────────────────────────────────

  /**
   * Get all discussion posts from the list.
   */
  async getDiscussionPosts(): Promise<Locator[]> {
    return this.discussionPosts.all();
  }

  /**
   * Get number of discussion posts.
   */
  async getDiscussionCount(): Promise<number> {
    const posts = await this.discussionPosts.all();
    return posts.length;
  }

  /**
   * Check if discussion list is empty.
   */
  async isDiscussionListEmpty(): Promise<boolean> {
    try {
      return await this.emptyState.isVisible({ timeout: 2_000 });
    } catch {
      return false;
    }
  }

  /**
   * Search for discussions by keyword.
   */
  async searchDiscussions(keyword: string): Promise<void> {
    await this.jsClearAndType(this.searchInput, keyword);
    await this.page.waitForTimeout(500);
  }

  /**
   * Clear search input.
   */
  async clearSearch(): Promise<void> {
    await this.searchInput.clear();
    await this.page.waitForTimeout(300);
  }

  /**
   * Get current search value.
   */
  async getSearchValue(): Promise<string | null> {
    return this.searchInput.inputValue();
  }

  /**
   * Filter discussions by category.
   */
  async filterByCategory(categoryName: string): Promise<void> {
    const filter = this.categoryFilter;
    if (await filter.isVisible()) {
      await filter.selectOption(categoryName);
      await this.page.waitForTimeout(800);
    }
  }

  /**
   * Sort discussions by specified criteria.
   * sortBy: 'newest', 'oldest', 'popular', 'most-commented'
   */
  async sortDiscussions(sortBy: 'newest' | 'oldest' | 'popular' | 'most-commented'): Promise<void> {
    const sortOptions: Record<string, string> = {
      newest: 'Mới nhất',
      oldest: 'Cũ nhất',
      popular: 'Phổ biến',
      'most-commented': 'Nhiều bình luận',
    };
    
    const select = this.sortButton;
    if (await select.isVisible()) {
      await select.selectOption(sortOptions[sortBy] || sortBy);
      await this.page.waitForTimeout(500);
    }
  }

  // ── Get Discussion Details ─────────────────────────────────────────────────

  /**
   * Get title of a discussion post by index.
   */
  async getPostTitle(index = 0): Promise<string | null> {
    const posts = await this.discussionPosts.all();
    if (posts.length > index) {
      return posts[index].locator('[data-field="title"]').textContent();
    }
    return null;
  }

  /**
   * Get content preview of a discussion post by index.
   */
  async getPostContent(index = 0): Promise<string | null> {
    const posts = await this.discussionPosts.all();
    if (posts.length > index) {
      return posts[index].locator('[data-field="content"]').textContent();
    }
    return null;
  }

  /**
   * Get author name of a discussion post by index.
   */
  async getPostAuthor(index = 0): Promise<string | null> {
    const posts = await this.discussionPosts.all();
    if (posts.length > index) {
      return posts[index].locator('[data-field="author"]').textContent();
    }
    return null;
  }

  /**
   * Get post creation date by index.
   */
  async getPostDate(index = 0): Promise<string | null> {
    const posts = await this.discussionPosts.all();
    if (posts.length > index) {
      return posts[index].locator('[data-field="date"]').textContent();
    }
    return null;
  }

  /**
   * Get number of likes for a post by index.
   */
  async getPostLikeCount(index = 0): Promise<number> {
    const posts = await this.discussionPosts.all();
    if (posts.length > index) {
      const likeText = await posts[index].locator('[data-field="likes"]').textContent();
      return parseInt(likeText?.replace(/\D/g, '') || '0', 10);
    }
    return 0;
  }

  /**
   * Get number of comments for a post by index.
   */
  async getPostCommentCount(index = 0): Promise<number> {
    const posts = await this.discussionPosts.all();
    if (posts.length > index) {
      const commentText = await posts[index].locator('[data-field="comments"]').textContent();
      return parseInt(commentText?.replace(/\D/g, '') || '0', 10);
    }
    return 0;
  }

  /**
   * Get category of a post by index.
   */
  async getPostCategory(index = 0): Promise<string | null> {
    const posts = await this.discussionPosts.all();
    if (posts.length > index) {
      return posts[index].locator('[data-field="category"]').textContent();
    }
    return null;
  }

  // ── Click on Discussion ────────────────────────────────────────────────────

  /**
   * Click on a discussion post to open details view.
   */
  async clickDiscussionPost(index = 0): Promise<void> {
    const posts = await this.discussionPosts.all();
    if (posts.length > index) {
      await this.jsClick(posts[index]);
      await this.page.waitForTimeout(1_000);
    }
  }

  /**
   * Click on discussion by title text.
   */
  async clickDiscussionByTitle(titleText: string): Promise<void> {
    const post = this.discussionList.locator(`text="${titleText}"`).first();
    await this.jsClick(post);
    await this.page.waitForTimeout(1_000);
  }

  // ── Comments & Replies ────────────────────────────────────────────────────

  /**
   * Enter a comment on the current discussion.
   */
  async enterComment(commentText: string): Promise<void> {
    await this.jsClearAndType(this.commentInput, commentText);
  }

  /**
   * Submit a comment.
   */
  async submitComment(): Promise<void> {
    await this.jsClick(this.commentSubmitButton);
    await this.page.waitForTimeout(800);
  }

  /**
   * Post a comment with text.
   */
  async postComment(commentText: string): Promise<void> {
    await this.enterComment(commentText);
    await this.submitComment();
  }

  /**
   * Get all comments from the comment section.
   */
  async getComments(): Promise<Locator[]> {
    return this.commentList.all();
  }

  /**
   * Get number of comments.
   */
  async getCommentCount(): Promise<number> {
    const comments = await this.commentList.all();
    return comments.length;
  }

  /**
   * Get comment text by index.
   */
  async getCommentText(index = 0): Promise<string | null> {
    const comments = await this.commentList.all();
    if (comments.length > index) {
      return comments[index].locator('.comment-text, [data-field="text"]').textContent();
    }
    return null;
  }

  /**
   * Get comment author by index.
   */
  async getCommentAuthor(index = 0): Promise<string | null> {
    const comments = await this.commentList.all();
    if (comments.length > index) {
      return comments[index].locator('.comment-author, [data-field="author"]').textContent();
    }
    return null;
  }

  /**
   * Delete a comment by index (if user is author).
   */
  async deleteComment(index = 0): Promise<void> {
    const comments = await this.commentList.all();
    if (comments.length > index) {
      const deleteBtn = comments[index].locator('button:has-text("Xóa"), [data-action="delete"]');
      if (await deleteBtn.isVisible()) {
        await this.jsClick(deleteBtn);
        await this.page.waitForTimeout(500);
      }
    }
  }

  // ── Post Actions (Like, Reply, Share, etc.) ────────────────────────────────

  /**
   * Like a discussion post.
   */
  async likePost(postId: string): Promise<void> {
    const likeBtn = this.getLikeButton(postId);
    if (await likeBtn.isVisible()) {
      await this.jsClick(likeBtn);
      await this.page.waitForTimeout(400);
    }
  }

  /**
   * Reply to a discussion post.
   */
  async replyToPost(postId: string): Promise<void> {
    const replyBtn = this.getReplyButton(postId);
    if (await replyBtn.isVisible()) {
      await this.jsClick(replyBtn);
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Share a discussion post.
   */
  async sharePost(postId: string): Promise<void> {
    const shareBtn = this.getShareButton(postId);
    if (await shareBtn.isVisible()) {
      await this.jsClick(shareBtn);
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Edit a discussion post (if user is author).
   */
  async editPost(postId: string): Promise<void> {
    const editBtn = this.getEditButton(postId);
    if (await editBtn.isVisible()) {
      await this.jsClick(editBtn);
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Delete a discussion post (if user is author).
   */
  async deletePost(postId: string): Promise<void> {
    const deleteBtn = this.getDeleteButton(postId);
    if (await deleteBtn.isVisible()) {
      await this.jsClick(deleteBtn);
      await this.page.waitForTimeout(500);
    }
  }

  // ── Loading & Wait States ──────────────────────────────────────────────────

  /**
   * Wait for discussions to finish loading.
   */
  async waitForLoadingComplete(timeoutMs = 5_000): Promise<boolean> {
    try {
      await this.loadingIndicator.waitFor({ state: 'hidden', timeout: timeoutMs });
      return true;
    } catch {
      return true; // Assume loaded if no loading indicator
    }
  }

  /**
   * Scroll down to load more discussions (if using infinite scroll).
   */
  async loadMoreDiscussions(): Promise<void> {
    await this.scrollToBottom(5, 500);
  }
}