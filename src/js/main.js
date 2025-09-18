(function ($) {
	"use strict";
  
	// Dropdown menu functionality
	$('nav .dropdown').hover(
	  function () {
		var $this = $(this);
		$this.addClass("show");
		$this.find("> a").attr("aria-expanded", true);
		$this.find(".dropdown-menu").addClass("show");
	  },
	  function () {
		var $this = $(this);
		$this.removeClass("show");
		$this.find("> a").attr("aria-expanded", false);
		$this.find(".dropdown-menu").removeClass("show");
	  }
	);
  
	// Connect Wallet Button Functionality (safe on pages without the button)
	async function connectWallet() {
	  const connectButton = document.getElementById("connectWallet");
	  const walletAddressDisplay = document.getElementById("walletAddress");
	  if (!connectButton) return;

	  if (typeof window.ethereum !== "undefined") {
		try {
		  const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
		  const walletAddress = accounts[0];
		  if (walletAddressDisplay) walletAddressDisplay.innerText = `Connected: ${walletAddress}`;
		  console.log("Wallet connected:", walletAddress);
		  connectButton.disabled = true;
		  connectButton.innerText = "Wallet Connected";
		} catch (error) {
		  console.error("Error connecting wallet:", error);
		}
	  } else {
		alert("MetaMask is not installed. Please install it to use this feature.");
	  }
	}

	const connectBtnEl = document.getElementById("connectWallet");
	if (connectBtnEl) {
	  connectBtnEl.addEventListener("click", connectWallet);
	}

	// Navbar dark-on-scroll toggle
	function handleNavbarOnScroll() {
	  const navbar = document.getElementById("ftco-navbar");
	  if (!navbar) return;
	  if (window.scrollY > 10) {
		navbar.classList.add("scrolled");
	  } else {
		navbar.classList.remove("scrolled");
	  }
	}
	window.addEventListener("scroll", handleNavbarOnScroll, { passive: true });
	// run once on load
	handleNavbarOnScroll();

	// Page load fade-in
	document.addEventListener("DOMContentLoaded", function() {
	  document.body.classList.add("page-animate");
	});
  })(jQuery);
  