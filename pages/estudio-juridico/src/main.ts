import './style.css'

/* =============== SHOW MENU =============== */
const navMenu = document.getElementById('nav-menu');
const navToggle = document.getElementById('nav-toggle');
const navClose = document.getElementById('nav-close');

/* Menu show */
if(navToggle){
    navToggle.addEventListener('click', () =>{
        navMenu?.classList.add('show-menu')
    })
}

/* Menu hidden */
if(navClose){
    navClose.addEventListener('click', () =>{
        navMenu?.classList.remove('show-menu')
    })
}

/* =============== REMOVE MENU MOBILE =============== */
const navLink = document.querySelectorAll('.nav__link')

const linkAction = () =>{
    const navMenu = document.getElementById('nav-menu')
    navMenu?.classList.remove('show-menu')
}
navLink.forEach(n => n.addEventListener('click', linkAction))

/* =============== CHANGE BACKGROUND HEADER =============== */
const scrollHeader = () =>{
    const header = document.getElementById('header')
    if(window.scrollY >= 50) {
      header?.classList.add('scroll-header')
    } else {
      header?.classList.remove('scroll-header')
    }
}
window.addEventListener('scroll', scrollHeader)

/* =============== SCROLL SECTIONS ACTIVE LINK =============== */
const sections = document.querySelectorAll('section[id]')

const scrollActive = () =>{
  	const scrollDown = window.scrollY

	sections.forEach((current: any) =>{
		const sectionHeight = current.offsetHeight,
			  sectionTop = current.offsetTop - 58,
			  sectionId = current.getAttribute('id'),
			  sectionsClass = document.querySelector('.nav__menu a[href*=' + sectionId + ']')

		if(scrollDown > sectionTop && scrollDown <= sectionTop + sectionHeight){
			sectionsClass?.classList.add('active-link')
		}else{
			sectionsClass?.classList.remove('active-link')
		}                                                    
	})
}
window.addEventListener('scroll', scrollActive)

/* =============== SHOW SCROLL UP =============== */ 
const scrollUp = () =>{
	const scrollUp = document.getElementById('scroll-up')
	if(window.scrollY >= 350) {
    scrollUp?.classList.add('show-scroll')
  } else {
    scrollUp?.classList.remove('show-scroll')
  }
}
window.addEventListener('scroll', scrollUp)

/* =============== CONTACT FORM =============== */
const contactForm = document.getElementById('contact-form')
const contactMessage = document.getElementById('contact-message')

const sendEmail = (e: Event) => {
  e.preventDefault();
  
  // Here we would typically use a service like EmailJS or a backend endpoint
  // For demonstration, we just show a success message
  if (contactMessage) {
    contactMessage.textContent = 'Mensaje enviado correctamente ✅ Nos pondremos en contacto pronto.';
    
    // Clear message after 5 seconds
    setTimeout(() => {
      contactMessage.textContent = '';
    }, 5000);
  }
  
  // Clear input fields
  (contactForm as HTMLFormElement)?.reset();
}

contactForm?.addEventListener('submit', sendEmail)

/* =============== SCROLL REVEAL ANIMATION =============== */
const observerOptions = {
  root: null,
  rootMargin: '0px',
  threshold: 0.15
};

const observer = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('active');
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

document.querySelectorAll('.reveal, .reveal-delay').forEach(el => {
  observer.observe(el);
});

/* =============== ACCORDION =============== */
const accordionItems = document.querySelectorAll('.accordion__item');

accordionItems.forEach((item) => {
  const accordionHeader = item.querySelector('.accordion__header');

  accordionHeader?.addEventListener('click', () => {
    const openItem = document.querySelector('.accordion-open');
    
    toggleItem(item);

    if (openItem && openItem !== item) {
      toggleItem(openItem);
    }
  });
});

const toggleItem = (item: Element) => {
  const accordionContent = item.querySelector('.accordion__content') as HTMLElement;

  if (item.classList.contains('accordion-open')) {
    accordionContent.removeAttribute('style');
    item.classList.remove('accordion-open');
  } else {
    accordionContent.style.height = accordionContent.scrollHeight + 'px';
    item.classList.add('accordion-open');
  }
}
