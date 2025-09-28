'use client';
import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { SplitText as GSAPSplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(GSAPSplitText, useGSAP);

export interface ShuffleProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  shuffleDirection?: 'left' | 'right';
  duration?: number;
  maxDelay?: number;
  ease?: string;
  shuffleTimes?: number;
  loop?: boolean;
  loopDelay?: number;
  stagger?: number;
  scrambleCharset?: string;
  color?: string;
}

const Shuffle: React.FC<ShuffleProps> = ({
  text,
  className='',
  style={},
  shuffleDirection='right',
  duration=0.5,
  maxDelay=0,
  ease='power3.out',
  shuffleTimes=1,
  loop=true,
  loopDelay=0.001,
  stagger=0.1,
  scrambleCharset='ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  color='#FF1C1C'
}) => {
  const ref = useRef<HTMLElement>(null);
  const splitRef = useRef<GSAPSplitText | null>(null);
  const wrapsRef = useRef<HTMLElement[]>([]);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const isInitializedRef = useRef(false);

  const rebuild = () => {
    if (!ref.current) return;
    
    // Clear previous animation and elements
    if (tlRef.current) tlRef.current.kill();
    
    wrapsRef.current.forEach(w => {
      const inner = w.firstElementChild as HTMLElement | null;
      const real = inner?.querySelector('[data-orig="1"]') as HTMLElement | null;
      if (real && w.parentNode) w.parentNode.replaceChild(real, w);
    });
    
    wrapsRef.current = [];
    
    // Revert any previous split text
    try { 
      if (splitRef.current) splitRef.current.revert(); 
    } catch {}
    
    // Make sure the text is clean before splitting
    if (isInitializedRef.current) {
      ref.current.textContent = text;
    }
    
    // Split the text into characters
    splitRef.current = new GSAPSplitText(ref.current, { type:'chars', charsClass:'sh-char' });
    const chars = splitRef.current.chars as HTMLElement[];
    const rolls = Math.max(1, Math.floor(shuffleTimes));
    
    chars.forEach(ch => {
      const parent = ch.parentElement;
      if (!parent) return;
      
      const w = ch.getBoundingClientRect().width;
      if (!w) return;
      
      // Create wrapper and strip for animation
      const wrap = document.createElement('span');
      wrap.className='inline-block overflow-hidden align-baseline';
      wrap.style.width = w+'px';
      
      const strip = document.createElement('span');
      strip.className='inline-block whitespace-nowrap will-change-transform';
      
      parent.insertBefore(wrap, ch);
      wrap.appendChild(strip);
      
      // Create original character
      const base = ch.cloneNode(true) as HTMLElement;
      base.setAttribute('data-orig','1');
      Object.assign(base.style, {width: w+'px'});
      strip.appendChild(base);
      
      // Create shuffle characters
      for (let i=0; i<rolls; i++) {
        const c = base.cloneNode(true) as HTMLElement;
        c.textContent = scrambleCharset.charAt(Math.floor(Math.random()*scrambleCharset.length));
        Object.assign(c.style, {width: w+'px'});
        strip.appendChild(c);
      }
      
      // Add the final character (same as original)
      const real = base.cloneNode(true) as HTMLElement;
      real.textContent = ch.textContent; // Ensure correct character
      Object.assign(real.style, {width: w+'px'});
      strip.appendChild(real);
      
      // Configure animation parameters
      const steps = rolls+1;
      let startX = 0;
      let endX = -steps * w;
      if (shuffleDirection === 'right') {
        startX = -steps * w;
        endX = 0;
      }
      
      gsap.set(strip, { x: startX });
      strip.dataset.startX = String(startX);
      strip.dataset.endX = String(endX);
      
      // Remove the original character since it's now in the strip
      if (ch.parentElement) ch.parentElement.removeChild(ch);
      
      wrapsRef.current.push(wrap);
    });
    
    isInitializedRef.current = true;
  };

  const play = () => {
    const strips = wrapsRef.current.map(w => w.firstElementChild as HTMLElement);
    const tl = gsap.timeline({
      repeat: loop ? -1 : 0,
      repeatDelay: loopDelay,
      onRepeat: () => {
        strips.forEach(s => gsap.set(s, { x: s.dataset.startX }));
        // refresh scramble characters
        wrapsRef.current.forEach(w => {
          const strip = w.firstElementChild as HTMLElement;
          const kids = Array.from(strip.children) as HTMLElement[];
          for (let i=1; i<kids.length-1; i++) {
            kids[i].textContent = scrambleCharset.charAt(Math.floor(Math.random()*scrambleCharset.length));
          }
        });
      }
    });
    
    const odds = strips.filter((_,i)=>i%2===1);
    const evens= strips.filter((_,i)=>i%2===0);
    
    tl.to(odds, {
      x:(i,t) => {
        const v = (t as HTMLElement).dataset.endX;
        return v ? parseFloat(v) : 0;
      },
      duration,
      ease,
      stagger
    }, 0);
    
    tl.to(evens, {
      x:(i,t) => {
        const v = (t as HTMLElement).dataset.endX;
        return v ? parseFloat(v) : 0;
      },
      duration,
      ease,
      stagger
    }, duration*0.7);
    
    tlRef.current = tl;
  };

  useGSAP(() => {
    rebuild();
    play();
    
    return () => {
      tlRef.current?.kill();
      try { splitRef.current?.revert(); } catch {}
    };
  }, { dependencies:[text, duration, maxDelay, ease, shuffleTimes, loop, loopDelay, stagger, scrambleCharset, shuffleDirection] });

  const Tag = 'h1';
  return React.createElement(Tag, {
    ref: ref as any,
    className: `uppercase tracking-[0.17em] font-bold ${className}`,
    style: { color, fontSize:'clamp(3rem,10vw,8rem)', lineHeight:1, ...style }
  }, text);
};

export default Shuffle;