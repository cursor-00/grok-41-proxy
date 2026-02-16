import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost',
  pretendToBeVisual: true,
  resources: 'usable',
  runScripts: 'dangerously'
});

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.CustomEvent = dom.window.CustomEvent;
global.Event = dom.window.Event;
global.EventTarget = dom.window.EventTarget;
global.XMLHttpRequest = dom.window.XMLHttpRequest;
global.FormData = dom.window.FormData;
global.Headers = dom.window.Headers;
global.Request = dom.window.Request;
global.Response = dom.window.Response;
global.fetch = dom.window.fetch;
