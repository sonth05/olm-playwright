import { expect, chromium } from '@playwright/test';
import { test } from '../../fixtures/auth.fixture';
import { HeaderComponent } from '../../components/HeaderComponent';
import { HocBaiPage } from '../../pages/HocBaiPage';
import { authPathForWorker } from '../../global-setup';
