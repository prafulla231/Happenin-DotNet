import 'zone.js';
import 'zone.js/testing';

import { getTestBed } from '@angular/core/testing';
import {
  BrowserTestingModule,
  platformBrowserTesting,
} from '@angular/platform-browser/testing';

getTestBed().initTestEnvironment(
  BrowserTestingModule,
  platformBrowserTesting()
);

import './app/app.spec';
import './app/components/auth/login/login.spec';
import './app/components/chatbot-widget/chatbot-widget.spec';
import './app/components/home/home.spec';
import './app/services/approval.spec';
import './app/services/auth.spec';
import './app/services/event.spec';
import './app/services/location.spec';
