// self.addEventListener("push", (event) => {
//   // TODO
// });

// self.addEventListener("notificationclick", (event) => {
//   // TODO
// });

self.addEventListener("push", (event) => {
  let notification = event.data.json();
  self.registration.showNotification(notification.title, notification.options);
});
