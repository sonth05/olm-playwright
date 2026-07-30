import { BasePage } from '@core/shared-pages/BasePage';
import type { Locator, Page } from '@playwright/test';

/**
 * Page Object — Liên lạc điện tử (1.4).
 * Tạo tin gửi cho toàn trường, nhóm/lớp, từng người, hoặc phụ huynh.
 */
export class LienLacDienTuPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // ── Selectors ──────────────────────────────────────────────────────────────

  private get sendToAllSchoolTab(): Locator {
    return this.page.locator('#pills-all-tab');
  }

  private get sendToGroupTab(): Locator {
    return this.page.locator('#pills-group-tab');
  }

  private get sendToUserTab(): Locator {
    return this.page.locator('#pills-user-tab');
  }

  private get sendToParentTab(): Locator {
    return this.page.locator('#pills-parent-tab');
  }

  private get titleInput(): Locator {
    return this.page.locator('#title');
  }

  private get contentInput(): Locator {
    return this.page.locator('#content');
  }

  private get linkInput(): Locator {
    return this.page.locator('#link');
  }

  private get sendButton(): Locator {
    return this.page.locator('#sendmessage');
  }

  private get messageCountIndicator(): Locator {
    return this.page.locator('#msgCount');
  }

  // ── Send to all school options ─────────────────────────────────────────────

  private get teacherAllSchoolOption(): Locator {
    return this.page.locator('input[value="1"][name="pill-all-school"]');
  }

  private get studentAllSchoolOption(): Locator {
    return this.page.locator('input[value="2"][name="pill-all-school"]');
  }

  private get parentAllSchoolOption(): Locator {
    return this.page.locator('input[value="3"][name="pill-all-school"]');
  }

  // ── Group/Class selection ──────────────────────────────────────────────────

  private get groupSelectionContainer(): Locator {
    return this.page.locator('#groups');
  }

  private getGroupCheckbox(groupName: string): Locator {
    return this.groupSelectionContainer.locator(`input[type="checkbox"][title*="${groupName}"]`);
  }

  // ── User selection (per person) ────────────────────────────────────────────

  private get userGroupSelector(): Locator {
    return this.page.locator('#list_groups');
  }

  private get userSelectionContainer(): Locator {
    return this.page.locator('#users');
  }

  private getUserCheckbox(userName: string): Locator {
    return this.userSelectionContainer.locator(`input[type="checkbox"][title*="${userName}"]`);
  }

  // ── Parent selection ───────────────────────────────────────────────────────

  private get parentGroupSelector(): Locator {
    return this.page.locator('#list_groups_parent');
  }

  private get parentSelectionContainer(): Locator {
    return this.page.locator('#parents');
  }

  private getParentCheckbox(parentName: string): Locator {
    return this.parentSelectionContainer.locator(`input[type="checkbox"][title*="${parentName}"]`);
  }

  // ── Navigation & Waiting ───────────────────────────────────────────────────

  /**
   * Open the Liên lạc điện tử page.
   * URL path: /truong-hoc/{school_id}/notify/send-menu
   */
  async open(schoolId: string): Promise<void> {
    await this.navigateTo(`/truong-hoc/${schoolId}/notify/send-menu`);
    await this.waitForSelector('#sendmessage', 10_000);
  }

  // ── Tab switching ──────────────────────────────────────────────────────────

  /**
   * Switch to "Gửi cho toàn trường" (Send to all school) tab.
   */
  async switchToSendToAllSchool(): Promise<void> {
    await this.sendToAllSchoolTab.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Switch to "Gửi cho nhóm/lớp" (Send to group/class) tab.
   */
  async switchToSendToGroup(): Promise<void> {
    await this.sendToGroupTab.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Switch to "Gửi cho từng người" (Send to individual) tab.
   */
  async switchToSendToUser(): Promise<void> {
    await this.sendToUserTab.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Switch to "Gửi cho phụ huynh" (Send to parent) tab.
   */
  async switchToSendToParent(): Promise<void> {
    await this.sendToParentTab.click();
    await this.page.waitForTimeout(500);
  }

  // ── Send to all school methods ─────────────────────────────────────────────

  /**
   * Select "Gửi cho giáo viên toàn trường" (Send to all teachers).
   */
  async selectSendToAllTeachers(): Promise<void> {
    await this.switchToSendToAllSchool();
    await this.teacherAllSchoolOption.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Select "Gửi cho học sinh toàn trường" (Send to all students).
   */
  async selectSendToAllStudents(): Promise<void> {
    await this.switchToSendToAllSchool();
    await this.studentAllSchoolOption.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Select "Gửi cho phụ huynh toàn trường" (Send to all parents).
   */
  async selectSendToAllParents(): Promise<void> {
    await this.switchToSendToAllSchool();
    await this.parentAllSchoolOption.click();
    await this.page.waitForTimeout(300);
  }

  // ── Group/Class methods ────────────────────────────────────────────────────

  /**
   * Select one or more groups/classes for sending.
   * groupNames: array of group/class names to select.
   */
  async selectGroups(groupNames: string[]): Promise<void> {
    await this.switchToSendToGroup();
    for (const groupName of groupNames) {
      const checkbox = this.getGroupCheckbox(groupName);
      if (await checkbox.isVisible()) {
        await checkbox.check();
        await this.page.waitForTimeout(200);
      }
    }
  }

  /**
   * Get all available groups.
   */
  async getAvailableGroups(): Promise<string[]> {
    await this.switchToSendToGroup();
    const groupElements = await this.page.locator('#groups input[type="checkbox"]').all();
    const groups: string[] = [];
    for (const el of groupElements) {
      const title = await el.getAttribute('title');
      if (title) groups.push(title);
    }
    return groups;
  }

  // ── User selection methods ─────────────────────────────────────────────────

  /**
   * Select users from a specific group.
   * First select the group, then select specific users.
   */
  async selectUsersFromGroup(groupName: string, userNames: string[]): Promise<void> {
    await this.switchToSendToUser();
    
    // Select group first
    const groupSelect = this.userGroupSelector;
    await groupSelect.selectOption({ label: groupName });
    await this.page.waitForTimeout(500);

    // Select users
    for (const userName of userNames) {
      const checkbox = this.getUserCheckbox(userName);
      if (await checkbox.isVisible()) {
        await checkbox.check();
        await this.page.waitForTimeout(200);
      }
    }
  }

  /**
   * Get available users for currently selected group.
   */
  async getAvailableUsersInGroup(): Promise<string[]> {
    const userElements = await this.page.locator('#users input[type="checkbox"]').all();
    const users: string[] = [];
    for (const el of userElements) {
      const title = await el.getAttribute('title');
      if (title) users.push(title);
    }
    return users;
  }

  // ── Parent selection methods ───────────────────────────────────────────────

  /**
   * Select parents from a specific group.
   */
  async selectParentsFromGroup(groupName: string, parentNames: string[]): Promise<void> {
    await this.switchToSendToParent();
    
    // Select group first
    const groupSelect = this.parentGroupSelector;
    await groupSelect.selectOption({ label: groupName });
    await this.page.waitForTimeout(500);

    // Select parents
    for (const parentName of parentNames) {
      const checkbox = this.getParentCheckbox(parentName);
      if (await checkbox.isVisible()) {
        await checkbox.check();
        await this.page.waitForTimeout(200);
      }
    }
  }

  /**
   * Get available parents for currently selected group.
   */
  async getAvailableParentsInGroup(): Promise<string[]> {
    const parentElements = await this.page.locator('#parents input[type="checkbox"]').all();
    const parents: string[] = [];
    for (const el of parentElements) {
      const title = await el.getAttribute('title');
      if (title) parents.push(title);
    }
    return parents;
  }

  // ── Message content methods ────────────────────────────────────────────────

  /**
   * Enter title/subject for the message.
   */
  async enterTitle(title: string): Promise<void> {
    await this.jsClearAndType(this.titleInput, title);
  }

  /**
   * Enter message content.
   * Max 140 characters (as indicated on UI).
   */
  async enterContent(content: string): Promise<void> {
    await this.jsClearAndType(this.contentInput, content);
    await this.page.waitForTimeout(300);
  }

  /**
   * Get current character count for message content.
   */
  async getContentCharCount(): Promise<string> {
    return (await this.messageCountIndicator.textContent()) || '';
  }

  /**
   * Enter optional link/URL.
   */
  async enterLink(link: string): Promise<void> {
    await this.jsClearAndType(this.linkInput, link);
  }

  /**
   * Get title value.
   */
  async getTitleValue(): Promise<string | null> {
    return this.titleInput.inputValue();
  }

  /**
   * Get content value.
   */
  async getContentValue(): Promise<string | null> {
    return this.contentInput.inputValue();
  }

  /**
   * Get link value.
   */
  async getLinkValue(): Promise<string | null> {
    return this.linkInput.inputValue();
  }

  // ── Form submission ────────────────────────────────────────────────────────

  /**
   * Click send button to submit the notification.
   */
  async send(): Promise<void> {
    await this.jsClick(this.sendButton);
    await this.page.waitForTimeout(1_000);
  }

  /**
   * Check if send button is enabled.
   */
  async isSendButtonEnabled(): Promise<boolean> {
    return !(await this.sendButton.isDisabled());
  }

  /**
   * Clear all form fields.
   */
  async clearForm(): Promise<void> {
    await this.titleInput.clear();
    await this.contentInput.clear();
    await this.linkInput.clear();
    await this.page.waitForTimeout(300);
  }
}