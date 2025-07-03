// Simple replacement for framer-motion in Next.js 15.3.1
// This avoids the "export *" issue with framer-motion

import React from 'react';

// Function to filter out motion-specific props
const filterMotionProps = (props) => {
  const {
    initial,
    animate,
    exit,
    transition,
    variants,
    whileHover,
    whileTap,
    whileDrag,
    whileFocus,
    whileInView,
    ...filteredProps
  } = props;
  return filteredProps;
};

// Basic motion component replacement
export const motion = {
  div: ({ children, className, style, ...props }) => (
    <div className={className} style={style} {...filterMotionProps(props)}>
      {children}
    </div>
  ),
  button: ({ children, className, style, ...props }) => (
    <button className={className} style={style} {...filterMotionProps(props)}>
      {children}
    </button>
  ),
  span: ({ children, className, style, ...props }) => (
    <span className={className} style={style} {...filterMotionProps(props)}>
      {children}
    </span>
  ),
  p: ({ children, className, style, ...props }) => (
    <p className={className} style={style} {...filterMotionProps(props)}>
      {children}
    </p>
  ),
  a: ({ children, className, style, ...props }) => (
    <a className={className} style={style} {...filterMotionProps(props)}>
      {children}
    </a>
  ),
  h1: ({ children, className, style, ...props }) => (
    <h1 className={className} style={style} {...filterMotionProps(props)}>
      {children}
    </h1>
  ),
  h2: ({ children, className, style, ...props }) => (
    <h2 className={className} style={style} {...filterMotionProps(props)}>
      {children}
    </h2>
  ),
  h3: ({ children, className, style, ...props }) => (
    <h3 className={className} style={style} {...filterMotionProps(props)}>
      {children}
    </h3>
  ),
  ul: ({ children, className, style, ...props }) => (
    <ul className={className} style={style} {...filterMotionProps(props)}>
      {children}
    </ul>
  ),
  li: ({ children, className, style, ...props }) => (
    <li className={className} style={style} {...filterMotionProps(props)}>
      {children}
    </li>
  ),
  section: ({ children, className, style, ...props }) => (
    <section className={className} style={style} {...filterMotionProps(props)}>
      {children}
    </section>
  ),
  aside: ({ children, className, style, ...props }) => (
    <aside className={className} style={style} {...filterMotionProps(props)}>
      {children}
    </aside>
  ),
  nav: ({ children, className, style, ...props }) => (
    <nav className={className} style={style} {...filterMotionProps(props)}>
      {children}
    </nav>
  ),
  header: ({ children, className, style, ...props }) => (
    <header className={className} style={style} {...filterMotionProps(props)}>
      {children}
    </header>
  ),
  footer: ({ children, className, style, ...props }) => (
    <footer className={className} style={style} {...filterMotionProps(props)}>
      {children}
    </footer>
  ),
  img: ({ className, style, ...props }) => (
    <img className={className} style={style} {...filterMotionProps(props)} />
  ),
  input: ({ className, style, ...props }) => (
    <input className={className} style={style} {...filterMotionProps(props)} />
  ),
  textarea: ({ children, className, style, ...props }) => (
    <textarea className={className} style={style} {...filterMotionProps(props)}>
      {children}
    </textarea>
  ),
  form: ({ children, className, style, ...props }) => (
    <form className={className} style={style} {...filterMotionProps(props)}>
      {children}
    </form>
  ),
  // Add any other elements your app uses
};

// Simple AnimatePresence replacement
export const AnimatePresence = ({ children, mode, initial }) => {
  return <>{children}</>;
};

// No-op hooks and functions
export const useAnimation = () => ({
  start: () => Promise.resolve(),
  stop: () => {},
});

export const useInView = () => [null, false];
export const useScroll = () => ({ scrollY: { get: () => 0, onChange: () => {} } });
export const useTransform = () => 0;
export const animate = () => ({ stop: () => {} });
export const m = motion;
export const LazyMotion = ({ children }) => <>{children}</>;
export const domAnimation = {};
export const domMax = {};
export const useMotionValue = () => ({ get: () => 0, set: () => {}, onChange: () => {} });
export const useSpring = () => useMotionValue();
export const useAnimate = () => [null, () => {}];
export const stagger = () => {};
export const useMotionTemplate = () => '';
export const useReducedMotion = () => false;
export const AnimationPlaybackControls = { play: () => {}, pause: () => {} };

export default motion; 