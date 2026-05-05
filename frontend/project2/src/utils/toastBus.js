// src/utils/toastBus.js
let _addToast = null;

export function registerToastHandler(fn) {
  _addToast = fn;
}

export function toast(msg, type = "success") {
  if (_addToast) _addToast({ msg, type, id: Date.now() + Math.random() });
}
