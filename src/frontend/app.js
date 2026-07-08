const searchButton = document.getElementById("searchButton");
const checkoutButton = document.getElementById("checkoutButton");
const queueStatus = document.getElementById("queueStatus");

searchButton?.addEventListener("click", () => {
  queueStatus.textContent = "Demand check complete";
});

checkoutButton?.addEventListener("click", () => {
  window.alert(
    "Checkout placeholder: in the full system this would create a pending payment and preserve the reservation lock.",
  );
});
