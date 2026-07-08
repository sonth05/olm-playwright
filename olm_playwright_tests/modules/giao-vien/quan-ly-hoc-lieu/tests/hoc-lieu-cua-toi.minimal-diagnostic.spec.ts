import { test, expect } from '../../../../fixtures/auth.fixture';
import { HocLieuCuaToiPage } from '../pages/HocLieuCuaToiPage';

test.describe('🔧 MINIMAL DIAGNOSTIC', () => {

  test('1️⃣ Check Auth - are we logged in?', async ({ authenticatedPage: page }) => {
    console.log('\n=== 1. CHECK AUTH ===');
    const url = page.url();
    console.log('Current URL:', url);
    
    await page.goto('/');
    const homeUrl = page.url();
    console.log('Home URL:', homeUrl);
    
    const isOnLogin = homeUrl.includes('dangnhap') || homeUrl.includes('login');
    console.log('On login page?', isOnLogin);
    
    if (isOnLogin) {
      console.error('❌ NOT LOGGED IN');
    } else {
      console.log('✅ Looks logged in');
    }
  });

  test('2️⃣ Check Page Load', async ({ authenticatedPage: page }) => {
    console.log('\n=== 2. CHECK PAGE LOAD ===');
    
    try {
      await page.goto('/hoc-lieu-cua-toi', { 
        waitUntil: 'domcontentloaded',
        timeout: 10000 
      });
      
      const url = page.url();
      const title = await page.title();
      const bodyText = await page.locator('body').textContent();
      
      console.log('URL:', url);
      console.log('Title:', title);
      console.log('Body text length:', bodyText?.length);
      
      if (!bodyText || bodyText.trim().length === 0) {
        console.error('❌ PAGE IS BLANK');
      } else {
        console.log('✅ Page has content');
      }
    } catch (error) {
      console.error('❌ Failed to load:', (error as Error).message);
    }
  });

  test('3️⃣ Check Page Object', async ({ authenticatedPage: page }) => {
    console.log('\n=== 3. CHECK PAGE OBJECT ===');
    
    try {
      const hocLieuPage = new HocLieuCuaToiPage(page);
      console.log('✅ Page object created');
      
      await hocLieuPage.navigateToHocLieuCuaToi();
      console.log('✅ Navigate worked');
      
      const url = page.url();
      console.log('URL:', url);
      
      const rows = hocLieuPage.getTableRows();
      const count = await rows.count();
      console.log('Table rows:', count);
      console.log('✅ Can access table');
    } catch (error) {
      console.error('❌ Error:', (error as Error).message);
    }
  });

  test('4️⃣ Check Selectors', async ({ authenticatedPage: page }) => {
    console.log('\n=== 4. CHECK SELECTORS ===');
    
    await page.goto('/hoc-lieu-cua-toi');
    
    const selectors = {
      'TAO_MOI_BTN': 'button:has-text("Tạo mới học liệu")',
      'TABLE': 'table.table',
      'DROPDOWN': '.dropdown-menu',
    };
    
    for (const [name, sel] of Object.entries(selectors)) {
      try {
        const count = await page.locator(sel).count();
        console.log(`${name}: ${count} element(s)`);
      } catch (e) {
        console.log(`${name}: error`);
      }
    }
  });

  test('5️⃣ Check Console Errors', async ({ authenticatedPage: page }) => {
    console.log('\n=== 5. CHECK CONSOLE ===');
    
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/hoc-lieu-cua-toi');
    await page.waitForTimeout(2000);
    
    console.log('Errors found:', errors.length);
    errors.forEach(err => console.error('  ❌ ' + err));
  });

});