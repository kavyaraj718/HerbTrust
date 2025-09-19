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

	// Page transition: animate out on navigation clicks
	function enableTransitions(){
	  try {
		var anchors = document.querySelectorAll('a.nav-link, a.btn, .navbar-brand');
		Array.prototype.forEach.call(anchors, function(a){
		  var href = a.getAttribute('href');
		  if(!href || href.indexOf('#') === 0 || href.startsWith('javascript:')) return;
		  a.addEventListener('click', function(ev){
			if(ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey || a.target === '_blank') return;
			ev.preventDefault();
			var url = a.getAttribute('href');
			document.body.classList.add('page-transition-out');
			setTimeout(function(){ window.location.href = url; }, 200);
		  });
		});
	  } catch(e){}
	}

	if(document.readyState === 'complete' || document.readyState === 'interactive') setTimeout(enableTransitions, 0);
	else document.addEventListener('DOMContentLoaded', enableTransitions);
  })(jQuery);
  