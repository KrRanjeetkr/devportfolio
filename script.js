const revealItems = document.querySelectorAll(".reveal");
const menuToggle = document.getElementById("menu-toggle");
const navMenu = document.getElementById("main-nav");
const navLinks = navMenu ? navMenu.querySelectorAll("a") : [];
const pageSections = document.querySelectorAll("main section[id]");
const anchorLinks = document.querySelectorAll('a[href^="#"]');
const siteHeader = document.querySelector(".site-header");
const themeToggle = document.getElementById("theme-toggle");
const contactForm = document.getElementById("contact-form");
const formStatus = document.getElementById("form-status");
const yearElement = document.getElementById("current-year");
const THEME_STORAGE_KEY = "rk-theme";
const CONTACT_EMAIL = "techranjitad@gmail.com";
const CONTACT_API_URL = `https://formsubmit.co/ajax/${CONTACT_EMAIL}`;
let activeSectionId = null;

const parseJsonSafe = async (response) => {
  try {
    return await response.json();
  } catch (error) {
    return {};
  }
};

const getScrollOffset = () => {
  const headerHeight = siteHeader ? siteHeader.offsetHeight : 0;
  return headerHeight + 12;
};

const scrollToAnchorTarget = (hash, updateHistory = true) => {
  if (!hash || !hash.startsWith("#")) {
    return;
  }

  const targetElement = document.querySelector(hash);
  if (!targetElement) {
    return;
  }

  const targetY = targetElement.getBoundingClientRect().top + window.scrollY - getScrollOffset();
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  window.scrollTo({
    top: Math.max(targetY, 0),
    behavior: prefersReducedMotion ? "auto" : "smooth",
  });

  if (updateHistory && window.location.hash !== hash) {
    history.pushState(null, "", hash);
  }
};

const setActiveNavLink = (sectionId) => {
  if (!sectionId || !navMenu) {
    return;
  }

  const activeLink = navMenu.querySelector(`a[href="#${sectionId}"]`);
  if (!activeLink) {
    return;
  }

  if (activeSectionId === sectionId) {
    return;
  }

  activeSectionId = sectionId;
  navLinks.forEach((link) => link.classList.remove("active"));
  activeLink.classList.add("active");
};

const updateActiveSectionFromScroll = () => {
  if (pageSections.length === 0) {
    return;
  }

  const offsetTop = window.scrollY + getScrollOffset() + 8;
  let currentSectionId = pageSections[0].getAttribute("id");

  pageSections.forEach((section) => {
    if (section.offsetTop <= offsetTop) {
      currentSectionId = section.getAttribute("id");
    }
  });

  setActiveNavLink(currentSectionId);
};

const applyTheme = (theme) => {
  const isDark = theme === "dark";
  document.body.classList.toggle("theme-dark", isDark);

  if (themeToggle) {
    themeToggle.textContent = isDark ? "Light Mode" : "Dark Mode";
    themeToggle.setAttribute("aria-pressed", String(isDark));
    themeToggle.setAttribute(
      "aria-label",
      isDark ? "Switch to light mode" : "Switch to dark mode"
    );
  }
};

const readSavedTheme = () => {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY);
  } catch (error) {
    return null;
  }
};

const saveTheme = (theme) => {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    // Ignore storage errors so theme toggle still works in-session.
  }
};

applyTheme(readSavedTheme() === "dark" ? "dark" : "light");

if (yearElement) {
  yearElement.textContent = String(new Date().getFullYear());
}

if (revealItems.length > 0) {
  const observer = new IntersectionObserver(
    (entries, ob) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          ob.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.14,
      rootMargin: "0px 0px -20px 0px",
    }
  );

  revealItems.forEach((item) => observer.observe(item));
}

if (pageSections.length > 0 && navLinks.length > 0) {
  updateActiveSectionFromScroll();
  window.addEventListener("scroll", updateActiveSectionFromScroll, { passive: true });
  window.addEventListener("resize", updateActiveSectionFromScroll);
}

if (anchorLinks.length > 0) {
  anchorLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const hash = link.getAttribute("href");
      if (!hash || hash === "#") {
        return;
      }

      const targetElement = document.querySelector(hash);
      if (!targetElement) {
        return;
      }

      event.preventDefault();
      scrollToAnchorTarget(hash);

      const targetSectionId = targetElement.getAttribute("id");
      if (targetSectionId) {
        setActiveNavLink(targetSectionId);
      }

      if (menuToggle && navMenu && navMenu.classList.contains("open")) {
        navMenu.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
      }
    });
  });
}

if (window.location.hash) {
  window.addEventListener("load", () => {
    scrollToAnchorTarget(window.location.hash, false);
    const targetElement = document.querySelector(window.location.hash);
    if (targetElement) {
      const targetSectionId = targetElement.getAttribute("id");
      if (targetSectionId) {
        setActiveNavLink(targetSectionId);
      }
    }
    updateActiveSectionFromScroll();
  });
} else {
  window.addEventListener("load", updateActiveSectionFromScroll);
}

if (menuToggle && navMenu) {
  menuToggle.addEventListener("click", () => {
    const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isExpanded));
    navMenu.classList.toggle("open");
  });
}

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const isDark = document.body.classList.contains("theme-dark");
    const nextTheme = isDark ? "light" : "dark";
    applyTheme(nextTheme);
    saveTheme(nextTheme);
  });
}

if (contactForm && formStatus) {
  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const requiredFields = contactForm.querySelectorAll("[required]");
    const hasEmptyField = Array.from(requiredFields).some((field) => !field.value.trim());

    if (hasEmptyField) {
      formStatus.textContent = "Please fill in all fields before sending your message.";
      formStatus.classList.add("error");
      return;
    }

    const nameField = contactForm.querySelector("#name");
    const emailField = contactForm.querySelector("#email");
    const messageField = contactForm.querySelector("#message");
    const submitButton = contactForm.querySelector('button[type="submit"]');

    const senderName = nameField && nameField.value.trim() ? nameField.value.trim() : "there";
    const senderEmail = emailField && emailField.value.trim() ? emailField.value.trim() : "";
    const senderMessage = messageField && messageField.value.trim() ? messageField.value.trim() : "";

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Sending...";
    }

    formStatus.textContent = "Sending your message...";
    formStatus.classList.remove("error");

    try {
      const response = await fetch(CONTACT_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: senderName,
          email: senderEmail,
          message: senderMessage,
          _subject: `Portfolio Contact: ${senderName}`,
          _template: "table",
          _captcha: "false",
        }),
      });

      const result = await parseJsonSafe(response);
      const responseMessage = String(result.message || "").toLowerCase();
      const isSuccess = response.ok && (result.success === "true" || result.success === true);

      if (isSuccess) {
        formStatus.textContent = "Thank you. Your message has been sent successfully.";
        formStatus.classList.remove("error");
        contactForm.reset();
      } else {
        if (responseMessage.includes("web server")) {
          formStatus.textContent =
            "FormSubmit requires a web server. Please open this site via http://localhost (not file://) and try again.";
        } else if (
          responseMessage.includes("activate") ||
          responseMessage.includes("activation")
        ) {
          formStatus.textContent =
            "Your form is not activated yet. Please open the verification email sent to techranjitad@gmail.com, click 'Activate Form', and submit again.";
        } else {
          formStatus.textContent = result.message || "Message could not be sent right now. Please try again.";
        }
        formStatus.classList.add("error");
      }
    } catch (error) {
      formStatus.textContent =
        "Network issue while sending. Please ensure internet connection and open site via a local web server.";
      formStatus.classList.add("error");
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Send Message";
      }
    }
  });
}
