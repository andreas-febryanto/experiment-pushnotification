// Push notification logic.
const VAPID_PUBLIC_KEY =
  "BPinjg7Ih7ZjCb4v0UpOlfhwln94ihOo54XCwVGkMIavdJO_DnKt6lrrysjE1Dxd2OX-2zwrShxMnaE_iwhSpTg";
const subscribeButton = document.getElementById("subscribe");
const unsubscribeButton = document.getElementById("unsubscribe");
const notifyMeButton = document.getElementById("notify-me");

subscribeButton.addEventListener("click", subscribeButtonHandler);
unsubscribeButton.addEventListener("click", unsubscribeButtonHandler);

async function registerServiceWorker() {
  await navigator.serviceWorker.register("../views/service-worker.js");
  updateUI();
}

async function unregisterServiceWorker() {
  const registration = await navigator.serviceWorker.getRegistration();
  await registration.unregister();
  updateUI();
}

async function subscribeToPush() {
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlB64ToUint8Array(VAPID_PUBLIC_KEY),
  });
  postToServer("http://localhost:3000/add-subscription", subscription);
  updateUI();
}

async function subscribeButtonHandler() {
  // Prevent the user from clicking the subscribe button multiple times.
  subscribeButton.disabled = true;
  const result = await Notification.requestPermission();
  if (result === "denied") {
    console.error("The user explicitly denied the permission request.");
    return;
  }
  if (result === "granted") {
    console.info("The user accepted the permission request.");
  }
  subscribeToPush();
}

async function unsubscribeFromPush() {
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration.pushManager.getSubscription();
  postToServer("http://localhost:3000/remove-subscription", {
    endpoint: subscription.endpoint,
  });
  const unsubscribed = await subscription.unsubscribe();
  if (unsubscribed) {
    console.info("Successfully unsubscribed from push notifications.");
  }
  updateUI();
}

async function unsubscribeButtonHandler() {
  unsubscribeFromPush();
}

// Convert a base64 string to Uint8Array.
// Must do this so the server can understand the VAPID_PUBLIC_KEY.
function urlB64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Startup logic.
if ("serviceWorker" in navigator && "PushManager" in window) {
  navigator.serviceWorker
    .register("./service-worker.js")
    .then((serviceWorkerRegistration) => {
      console.info("Service worker was registered.");
      console.info({ serviceWorkerRegistration });
    })
    .catch((error) => {
      console.error("An error occurred while registering the service worker.");
      console.error(error);
    });
  subscribeButton.disabled = false;
} else {
  console.error("Browser does not support service workers or push messages.");
}

// Logic for the "Notify me" and "Notify all" buttons.

document.getElementById("notify-me").addEventListener("click", async () => {
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration.pushManager.getSubscription();
  fetch("/notify-me", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  });
});

document.getElementById("notify-all").addEventListener("click", async () => {
  const response = await fetch("/notify-all", {
    method: "POST",
  });
  if (response.status === 409) {
    document.getElementById("notification-status-message").textContent =
      "There are no subscribed endpoints to send messages to, yet.";
  }
});

async function updateUI() {
  const registrationButton = document.getElementById("register");
  const unregistrationButton = document.getElementById("unregister");
  const registrationStatus = document.getElementById(
    "registration-status-message"
  );
  const subscriptionButton = document.getElementById("subscribe");
  const unsubscriptionButton = document.getElementById("unsubscribe");
  const subscriptionStatus = document.getElementById(
    "subscription-status-message"
  );
  const notifyMeButton = document.getElementById("notify-me");
  const notificationStatus = document.getElementById(
    "notification-status-message"
  );
  // Disable all buttons by default.
  registrationButton.disabled = true;
  unregistrationButton.disabled = true;
  subscriptionButton.disabled = true;
  unsubscriptionButton.disabled = true;
  notifyMeButton.disabled = true;
  // Service worker is not supported so we can't go any further.
  if (!"serviceWorker" in navigator) {
    registrationStatus.textContent =
      "This browser doesn't support service workers.";
    subscriptionStatus.textContent =
      "Push subscription on this client isn't possible because of lack of service worker support.";
    notificationStatus.textContent =
      "Push notification to this client isn't possible because of lack of service worker support.";
    return;
  }
  const registration = await navigator.serviceWorker.getRegistration();
  // Service worker is available and now we need to register one.
  if (!registration) {
    registrationButton.disabled = false;
    registrationStatus.textContent =
      "No service worker has been registered yet.";
    subscriptionStatus.textContent =
      "Push subscription on this client isn't possible until a service worker is registered.";
    notificationStatus.textContent =
      "Push notification to this client isn't possible until a service worker is registered.";
    return;
  }
  registrationStatus.textContent = `Service worker registered. Scope: ${registration.scope}`;
  const subscription = await registration.pushManager.getSubscription();
  // Service worker is registered and now we need to subscribe for push
  // or unregister the existing service worker.
  if (!subscription) {
    unregistrationButton.disabled = false;
    subscriptionButton.disabled = false;
    subscriptionStatus.textContent = "Ready to subscribe this client to push.";
    notificationStatus.textContent =
      "Push notification to this client will be possible once subscribed.";
    return;
  }
  // Service worker is registered and subscribed for push and now we need
  // to unregister service worker, unsubscribe to push, or send notifications.
  subscriptionStatus.textContent = `Service worker subscribed to push. Endpoint: ${subscription.endpoint}`;
  notificationStatus.textContent =
    "Ready to send a push notification to this client!";
  unregistrationButton.disabled = false;
  notifyMeButton.disabled = false;
  unsubscriptionButton.disabled = false;
}

async function postToServer(url, data) {
  let response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

window.onload = updateUI;
