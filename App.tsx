/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Ticket, MapPin, Menu, X, Calendar, Play, ChevronLeft, ChevronRight, Heart, Globe, Zap, Sparkles, Gift, Infinity as InfinityIcon, Stamp } from 'lucide-react';
import FluidBackground from './components/FluidBackground';
import GradientText from './components/GlitchText';
import CustomCursor from './components/CustomCursor';
import ArtistCard from './components/ArtistCard';
import TimeFrequency from './components/TimeFrequency';
import MusicPlayer from './components/MusicPlayer';
import { Artist } from './types';

// Dummy Data
const MEMORY: Artist[] = [
  { 
    id: '1', 
    name: 'Riverside Reverie', 
    genre: 'First Frames', 
    day: 'JUNE 13', 
    image: 'https://image.polaris1111.me/2026/339e7841bc936b59d5e085a6079712d3.jpg',
    description: '与你的第一次相见。那天的江边音乐节，仿佛时间静止，只有我们和音乐在流动。\n 一江斑驳影，尽向伊人倾。'
  },
  { 
    id: '2', 
    name: 'Golden Hour', 
    genre: 'Sunset Glow', 
    day: 'JUNE 14', 
    image: 'https://image.polaris1111.me/2026/ef8589042923fd3c4ae3a8dd6743ecbf.jpg',
    description: '第一次去武昌湾，日落还行，但夜色很美——不过最美的事物另有其人～'
  },
  { 
    id: '3', 
    name: 'Yujia Mountain', 
    genre: '27 Seconds', 
    day: 'JUNE 17', 
    image: 'https://image.polaris1111.me/2026/16a3393777b6c411e214ac63c6956cda.jpg',
    description: '从梧桐语的会饮咖啡厅到图书馆，从马鞍山公园到喻家山，从华科到地大......与你在一起的每个地方，每个时刻，都似乎充满了惊喜与幸运'
  },
  { 
    id: '4', 
    name: 'The Question', 
    genre: 'Riverbank Vow', 
    day: 'JUNE 20', 
    image: 'https://image.polaris1111.me/2026/034daef92a6eb13d1927b2f4db4be498.jpg',
    description: '无比幸福的一天。\n 下午去财大自习，晚饭吃抓饭，晚上去江边散步，又是暴走两万步。\n 牵起了你的手，那种感觉真的好美妙。'
  },
  { 
    id: '5', 
    name: 'Your Hand', 
    genre: 'Warm Grip', 
    day: 'JUNE 20', 
    image: 'https://image.polaris1111.me/2026/c8c5a13593635f44adb6864484de6605.jpg',
    description: '“你是我一直寻找的另一半吗” \n “我想...是的” \n “你就是！”'
  },
  { 
    id: '6', 
    name: 'Study Date', 
    genre: 'Old Classroom', 
    day: 'JUNE 23', 
    image: 'https://image.polaris1111.me/2026/24a5267b3f2788d9921d09a920a6dd77.jpg',
    description: '在财大自习了大概一天。去吃了高记陋室汤包，味道还真不错。\n 晚上在操场上散步，站在看台上说了什么话，你说日后想起来一定很害羞——可惜我现在忘了，但那份悸动我永远记得。'
  },
];

const App: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  
  const [purchasingIndex, setPurchasingIndex] = useState<number | null>(null);
  const [purchasedSet, setPurchasedSet] = useState<Set<number>>(new Set());
  const [showToast, setShowToast] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleToBeContinued = () => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setShowToast(true);
    toastTimerRef.current = setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  // Handle keyboard navigation for artist modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedArtist) return;
      if (e.key === 'ArrowLeft') navigateArtist('prev');
      if (e.key === 'ArrowRight') navigateArtist('next');
      if (e.key === 'Escape') setSelectedArtist(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedArtist]);

  const handlePurchase = (index: number) => {
    setPurchasingIndex(index);
    setTimeout(() => {
      setPurchasingIndex(null);
      setPurchasedSet(prev => new Set(prev).add(index));
    }, 1500);
  };

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const navigateArtist = (direction: 'next' | 'prev') => {
    if (!selectedArtist) return;
    const currentIndex = MEMORY.findIndex(a => a.id === selectedArtist.id);
    let nextIndex;
    if (direction === 'next') {
      nextIndex = (currentIndex + 1) % MEMORY.length;
    } else {
      nextIndex = (currentIndex - 1 + MEMORY.length) % MEMORY.length;
    }
    setSelectedArtist(MEMORY[nextIndex]);
  };
  
  return (
    <div className="relative min-h-screen text-white selection:bg-[#4fb7b3] selection:text-black cursor-auto md:cursor-none overflow-x-hidden">
      <CustomCursor />
      <FluidBackground />
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 md:px-8 py-6 mix-blend-difference">
        <div className="font-heading text-xl md:text-2xl font-bold tracking-tighter text-white cursor-default z-50">MYLOVE</div>
        
        {/* Desktop Menu */}
        <div className="hidden md:flex gap-10 text-sm font-bold tracking-widest uppercase">
          {['Chronicles', 'Moments', 'Letters', 'Promises'].map((item) => (
            <button 
              key={item} 
              onClick={() => scrollToSection(item.toLowerCase())}
              className="hover:text-[#a8fbd3] transition-colors text-white cursor-pointer bg-transparent border-none"
              data-hover="true"
            >
              {item}
            </button>
          ))}
        </div>
        {/* Right Actions: Music Player & Mobile Menu */}
        <div className="flex items-center gap-3 z-50">
          <MusicPlayer />
          <button 
            className="md:hidden text-white relative w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Menu"
          >
             {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-30 bg-[#31326f]/95 backdrop-blur-xl flex flex-col items-center justify-center gap-8 md:hidden"
          >
            {['Chronicles', 'Moments', 'Letters', 'Promises'].map((item) => (
              <button
                key={item}
                onClick={() => scrollToSection(item.toLowerCase())}
                className="text-4xl font-heading font-bold text-white hover:text-[#a8fbd3] transition-colors uppercase bg-transparent border-none"
              >
                {item}
              </button>
            ))}
            
            <div className="absolute bottom-10 flex gap-6">
               <a href="https://x.com/GoogleAIStudio" className="text-white/50 hover:text-white transition-colors">Twitter</a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HERO SECTION */}
      <header className="relative h-[100svh] min-h-[600px] flex flex-col items-center justify-center overflow-hidden px-4">
        <motion.div 
          style={{ y, opacity }}
          className="z-10 text-center flex flex-col items-center w-full max-w-6xl pb-24 md:pb-20"
        >
           {/* Date / Location */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="flex items-center gap-3 md:gap-6 text-xs md:text-base font-mono text-[#a8fbd3] tracking-[0.2em] md:tracking-[0.3em] uppercase mb-4 bg-black/20 px-4 py-2 rounded-full backdrop-blur-sm"
          >
            <span>WUHAN</span>
            <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-[#4fb7b3] rounded-full animate-pulse"/>
            <span>SUMMER 2026</span>
          </motion.div>

          {/* Main Title */}
          <div className="relative w-full flex justify-center items-center">
            <GradientText 
              text="XIAOYE" 
              as="h1" 
              className="text-[15vw] md:text-[14vw] leading-[0.9] font-black tracking-tighter text-center" 
            />
            {/* Optimized Orb - Reduced Blur for Performance */}
            <motion.div 
               className="absolute -z-20 w-[50vw] h-[50vw] bg-white/5 blur-[40px] rounded-full pointer-events-none will-change-transform"
               animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.3, 0.6, 0.3] }}
               transition={{ duration: 6, repeat: Infinity }}
               style={{ transform: 'translateZ(0)' }}
            />
          </div>
          
          <motion.div
             initial={{ scaleX: 0 }}
             animate={{ scaleX: 1 }}
             transition={{ duration: 1.5, delay: 0.5, ease: "circOut" }}
             className="w-full max-w-md h-px bg-gradient-to-r from-transparent via-white/50 to-transparent mt-4 md:mt-8 mb-6 md:mb-8"
          />

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="text-base md:text-2xl font-light max-w-xl mx-auto text-white/90 leading-relaxed drop-shadow-lg px-4"
          >
            A 100% story that began on a June afternoon
          </motion.p>
        </motion.div>

        {/* MARQUEE - SLOWED DOWN for Performance & Aesthetics */}
        <div className="absolute bottom-12 md:bottom-16 left-0 w-full py-4 md:py-6 bg-white text-black z-20 overflow-hidden border-y-4 border-black shadow-[0_0_40px_rgba(255,255,255,0.4)]">
          <motion.div 
            className="flex w-fit will-change-transform"
            animate={{ x: "-50%" }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          >
            {/* Duplicate content for seamless loop */}
            {[0, 1].map((key) => (
              <div key={key} className="flex whitespace-nowrap shrink-0">
                {[...Array(4)].map((_, i) => (
                  <span key={i} className="text-3xl md:text-7xl font-heading font-black px-8 flex items-center gap-4">
                    100% GIRL <span className="text-black text-2xl md:text-4xl">●</span> 
                    SINCE JUNE <span className="text-black text-2xl md:text-4xl">●</span> 
                  </span>
                ))}
              </div>
            ))}
          </motion.div>
        </div>
      </header>

      {/* TIME FREQUENCY SECTION (COUNT-UP & COUNTDOWN) */}
      <TimeFrequency />

      {/* MOMENTS SECTION */}
      <section id="moments" className="relative z-10 py-20 md:py-32">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 md:mb-16 px-4">
             <h2 className="text-5xl md:text-8xl font-heading font-bold uppercase leading-[0.9] drop-shadow-lg break-words w-full md:w-auto">
              OUR <br/> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#a8fbd3] to-[#4fb7b3]">Moments</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-t border-l border-white/10 bg-black/20 backdrop-blur-sm">
            {MEMORY.map((artist) => (
              <ArtistCard key={artist.id} artist={artist} onClick={() => setSelectedArtist(artist)} />
            ))}
          </div>
        </div>
      </section>

      {/* LETTERS SECTION */}
      <section id="letters" className="relative z-10 py-20 md:py-32 bg-black/20 backdrop-blur-sm border-t border-white/10 overflow-hidden">
        {/* Decorative blurred circle - Optimized */}
        <div className="absolute top-1/2 right-[-20%] w-[50vw] h-[50vw] bg-[#4fb7b3]/20 rounded-full blur-[40px] pointer-events-none will-change-transform" style={{ transform: 'translateZ(0)' }} />

        <div className="max-w-7xl mx-auto px-4 md:px-6 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-16 items-center">
            <div className="lg:col-span-5 order-2 lg:order-1">
              <h2 className="text-4xl md:text-7xl font-heading font-bold mb-6 md:mb-8 leading-tight">
                Beyond <br/> <GradientText text="DISTANCE" className="text-5xl md:text-7xl" />
              </h2>
              <p className="text-lg md:text-xl text-gray-200 mb-8 md:mb-12 font-light leading-relaxed drop-shadow-md">
                有时觉得，计算机的计数法还挺贴切——比如今天，或许该算作我们一起度过的第 0 个七夕。相隔千里，只能借这方小站，寄去满腹情思。献给你——我的百分百女孩。
              </p>
              
              <div className="space-y-6 md:space-y-8">
                {[
                  { icon: Heart, title: 'First Encounter', desc: '一江斑驳影，尽向伊人倾' },
                  { icon: Heart, title: 'Bound By Fate', desc: '你的过去，竟然与我有关；我的未来，都愿与你相连。' },
                  { icon: Heart, title: 'Whispers of Love', desc: '你愿意为了我而改变……这真的比世界上任何情话还要动听。' },
                ].map((feature, i) => (
                  <div
                    key={i} 
                    className="flex items-start gap-6"
                  >
                    <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/5">
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg md:text-xl font-bold mb-1 md:mb-2 font-heading">{feature.title}</h4>
                      <p className="text-sm text-gray-300">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-7 relative h-[400px] md:h-[700px] w-full order-1 lg:order-2">
              <div className="absolute inset-0 bg-gradient-to-br from-[#637ab9] to-[#4fb7b3] rounded-3xl rotate-3 opacity-30 blur-xl" />
              <div className="relative h-full w-full rounded-3xl overflow-hidden border border-white/10 group shadow-2xl">
                <img 
                  src="https://image.polaris1111.me/2026/2725e781b85764cddf09055a7fcb4669.jpg" 
                  alt="Crowd" 
                  className="h-full w-full object-cover transition-transform duration-[1.5s] group-hover:scale-110 will-change-transform" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                
                <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10">
                  <div className="text-5xl md:text-8xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/0 opacity-50">
                    06.20
                  </div>
                  <div className="text-lg md:text-xl font-bold tracking-widest uppercase mt-2 text-white">
                    A RIVERSIDE STROLL
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROMISES SECTION */}
      <section id="promises" className="relative z-10 py-20 md:py-32 px-4 md:px-6 bg-black/30 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 md:mb-20">
             <h2 className="text-5xl md:text-9xl font-heading font-bold opacity-20 text-white">
               PROMISES
             </h2>
             <p className="text-[#a8fbd3] font-mono uppercase tracking-widest -mt-3 md:-mt-8 relative z-10 text-sm md:text-base">
               承诺小铺 · 只收爱心
             </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { 
                name: '亲吻卡', 
                price: '💗×1', 
                color: 'white', 
                accent: 'bg-white/5',
                icon: Heart,
                benefits: [
                  { icon: Heart, text: '凭此卡可兑换一个亲亲' },
                  { icon: MapPin, text: '不限时间，不限地点' },
                  { icon: Zap, text: '可叠加使用，上不封顶' },
                ],
                footer: '本卡最终解释权归你所有'
              },
              { 
                name: '奇妙礼物', 
                price: '💗×99', 
                color: 'teal', 
                accent: 'bg-[#4fb7b3]/10 border-[#4fb7b3]/50',
                icon: Gift,
                benefits: [
                  { icon: Gift, text: '一份开学时的神秘礼物' },
                  { icon: MapPin, text: '线索：与我们的 Evil TODO 清单有关 (bushi)' },
                  { icon: Zap, text: '附赠拆礼物时的拥抱一枚' },
                ],
                footer: '礼物会迟到，但心意不会'
              },
              { 
                name: '一辈子通行证', 
                price: '💗×∞', 
                color: 'periwinkle', 
                accent: 'bg-[#637ab9]/10 border-[#637ab9]/50',
                icon: InfinityIcon,
                benefits: [
                  { icon: InfinityIcon, text: 'TODO 清单，我们一起——慢慢打卡' },
                  { icon: MapPin, text: '所有周末、假期、季节的优先占用权' },
                  { icon: Globe, text: '不可转让、不可退换、永久有效' },
                ],
                footer: '分期付款，期限是一辈子'
              },
            ].map((ticket, i) => {
              const isPurchasing = purchasingIndex === i;
              const isPurchased = purchasedSet.has(i);
              const isDisabled = purchasingIndex !== null;
              const TicketIcon = ticket.icon;

              return (
                <motion.div
                  key={i}
                  whileHover={isDisabled || isPurchased ? {} : { y: -20 }}
                  className={`relative p-8 md:p-10 border border-white/10 backdrop-blur-md flex flex-col min-h-[450px] md:min-h-[550px] transition-colors duration-300 ${ticket.accent} ${isDisabled && !isPurchased ? 'opacity-50 grayscale' : ''} will-change-transform`}
                  data-hover={!isDisabled && !isPurchased}
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-2 rounded-xl ${isPurchased ? 'bg-[#a8fbd3]/20' : 'bg-white/10'}`}>
                        <TicketIcon className={`w-5 h-5 ${isPurchased ? 'text-[#a8fbd3]' : ticket.color === 'white' ? 'text-white' : ticket.color === 'teal' ? 'text-[#4fb7b3]' : 'text-[#637ab9]'}`} />
                      </div>
                      <h3 className="text-2xl md:text-3xl font-heading font-bold text-white">{ticket.name}</h3>
                    </div>
                    <div className={`text-5xl md:text-6xl font-bold mb-8 md:mb-10 tracking-tighter ${ticket.color === 'white' ? 'text-white' : ticket.color === 'teal' ? 'text-[#4fb7b3]' : 'text-[#637ab9]'}`}>
                      {ticket.price}
                    </div>
                    <ul className="space-y-4 md:space-y-6 text-sm text-gray-200">
                      {ticket.benefits.map((benefit, j) => (
                        <li key={j} className="flex items-center gap-3">
                          <benefit.icon className={`w-5 h-5 ${j === 0 ? 'text-gray-400' : j === 1 ? 'text-gray-400' : ticket.color === 'teal' ? 'text-[#a8fbd3]' : 'text-[#4fb7b3]'}`} />
                          <span className={j > 0 ? 'text-white' : ''}>{benefit.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <button 
                    onClick={() => handlePurchase(i)}
                    disabled={isDisabled || isPurchased}
                    className={`w-full py-4 text-sm font-bold uppercase tracking-[0.2em] border border-white/20 transition-all duration-300 mt-8 group overflow-hidden relative 
                      ${isPurchased 
                        ? 'bg-[#a8fbd3] text-black border-[#a8fbd3] cursor-default' 
                        : isPurchasing 
                          ? 'bg-white/20 text-white cursor-wait'
                          : isDisabled 
                            ? 'cursor-not-allowed opacity-50' 
                            : 'text-white cursor-pointer hover:bg-white hover:text-black'
                      }`}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {isPurchasing ? (
                        <>
                          <Heart className="w-4 h-4 animate-pulse" />
                          支付中...
                        </>
                      ) : isPurchased ? (
                        <>
                          <Stamp className="w-4 h-4" />
                          已生效
                        </>
                      ) : (
                        '💗 支付'
                      )}
                    </span>
                    {/* Only show hover effect if actionable */}
                    {!isDisabled && !isPurchased && !isPurchasing && (
                      <div className="absolute inset-0 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300 ease-out -z-0" />
                    )}
                  </button>
                  
                  {isPurchased && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-center mt-3 text-white/40 font-mono"
                    >
                      {ticket.footer}
                    </motion.p>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/10 py-12 md:py-16 bg-black/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <div>
             <div className="font-heading text-3xl md:text-4xl font-bold tracking-tighter mb-4 text-white">XiaoYe</div>
             <div className="flex gap-2 text-xs font-mono text-gray-400">
               <span>created by polaris</span>
             </div>
          </div>
          
          <div className="flex gap-6 md:gap-8 flex-wrap">
            <button 
              onClick={handleToBeContinued}
              className="text-gray-400 hover:text-white font-bold uppercase text-xs tracking-widest transition-colors cursor-pointer bg-transparent border-none p-0"
              data-hover="true"
            >
              To Be Continued
            </button>
          </div>
        </div>
      </footer>

      {/* Artist Detail Modal */}
      <AnimatePresence>
        {selectedArtist && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedArtist(null)}
            className="fixed inset-0 z-[60] flex items-center md:items-center justify-center p-4 bg-black/50 backdrop-blur-md cursor-auto overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-5xl bg-[#1a1b3b] border border-white/10 overflow-hidden flex flex-col md:flex-row shadow-2xl shadow-[#4fb7b3]/10 group/modal"
            >
              {/* Close Button — fixed on mobile, absolute on desktop */}
              <button
                onClick={() => setSelectedArtist(null)}
                className="fixed top-4 right-4 z-30 md:absolute md:top-4 md:right-4 p-2 rounded-full bg-black/50 text-white hover:bg-white hover:text-black transition-colors shadow-lg"
                data-hover="true"
                aria-label="Close"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Navigation Buttons — fixed at viewport bottom on mobile, absolute on image side on desktop */}
              <button
                onClick={(e) => { e.stopPropagation(); navigateArtist('prev'); }}
                className="fixed left-4 bottom-6 z-30 md:absolute md:left-4 md:bottom-auto md:top-1/2 md:-translate-y-1/2 p-3 rounded-full bg-black/60 text-white hover:bg-white hover:text-black transition-colors border border-white/10 backdrop-blur-sm shadow-lg"
                data-hover="true"
                aria-label="Previous"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); navigateArtist('next'); }}
                className="fixed right-4 bottom-6 z-30 md:absolute md:right-8 md:bottom-auto md:top-1/2 md:-translate-y-1/2 p-3 rounded-full bg-black/60 text-white hover:bg-white hover:text-black transition-colors border border-white/10 backdrop-blur-sm shadow-lg"
                data-hover="true"
                aria-label="Next"
              >
                <ChevronRight className="w-6 h-6" />
              </button>

              {/* Image Side */}
              <div className="w-full md:w-1/2 h-64 md:h-auto relative overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.img 
                    key={selectedArtist.id}
                    src={selectedArtist.image} 
                    alt={selectedArtist.name} 
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </AnimatePresence>
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1b3b] via-transparent to-transparent md:bg-gradient-to-r" />
              </div>

              {/* Content Side */}
              <div className="w-full md:w-1/2 p-8 pb-24 md:p-12 flex flex-col justify-center relative">
                <motion.div
                  key={selectedArtist.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                >
                  <div className="flex items-center gap-3 text-[#4fb7b3] mb-4">
                     <Calendar className="w-4 h-4" />
                     <span className="font-mono text-sm tracking-widest uppercase">{selectedArtist.day}</span>
                  </div>
                  
                  <h3 className="text-4xl md:text-6xl font-heading font-bold uppercase leading-none mb-2 text-white">
                    {selectedArtist.name}
                  </h3>
                  
                  <p className="text-lg text-[#a8fbd3] font-medium tracking-widest uppercase mb-6">
                    {selectedArtist.genre}
                  </p>
                  
                  <div className="h-px w-20 bg-white/20 mb-6" />
                  
                  <div className="text-gray-300 leading-relaxed text-lg font-light mb-8 space-y-4">
                    {selectedArtist.description.split('\n').map((paragraph, i) => (
                      <p key={i}>{paragraph}</p>
                    ))}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Surprise Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] px-6 py-3.5 rounded-full bg-[#1a1b3b]/95 border border-[#4fb7b3]/40 backdrop-blur-xl shadow-[0_0_30px_rgba(79,183,179,0.3)] flex items-center gap-3 text-white pointer-events-auto cursor-pointer"
            onClick={() => setShowToast(false)}
            data-hover="true"
          >
            <Sparkles className="w-5 h-5 text-[#a8fbd3] shrink-0 animate-pulse" />
            <span className="font-medium text-sm md:text-base tracking-wider text-white">
              后续还有更多惊喜
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;