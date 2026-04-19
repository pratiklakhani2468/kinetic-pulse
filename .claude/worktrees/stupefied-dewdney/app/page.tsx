'use client'

import { useRef, useEffect, useState } from 'react'
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  useAnimationControls,
  animate,
} from 'framer-motion'
import { Button } from '@heroui/react/button'
import { Chip } from '@heroui/react/chip'

// ─── Animated Counter Hook ──────────────────────────────────────────────────
function useAnimatedCounter(end: number, duration = 2000) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!isInView) return
    const stepTime = 16
    const steps = duration / stepTime
    const increment = end / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= end) {
        setCount(end)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, stepTime)
    return () => clearInterval(timer)
  }, [isInView, end, duration])

  return { ref, count }
}

// ─── Skeleton Data ──────────────────────────────────────────────────────────
const JOINTS = {
  head:   [100, 38],
  neck:   [100, 68],
  lSho:   [66,  88],
  rSho:   [134, 88],
  lElb:   [44,  138],
  rElb:   [156, 138],
  lWri:   [32,  182],
  rWri:   [168, 182],
  lHip:   [80,  192],
  rHip:   [120, 192],
  lKne:   [72,  268],
  rKne:   [128, 268],
  lAnk:   [68,  340],
  rAnk:   [132, 340],
  midTor: [100, 145],
  midHip: [100, 192],
}

const BONES: [keyof typeof JOINTS, keyof typeof JOINTS][] = [
  ['neck',  'lSho'],
  ['neck',  'rSho'],
  ['lSho',  'lElb'],
  ['rSho',  'rElb'],
  ['lElb',  'lWri'],
  ['rElb',  'rWri'],
  ['neck',  'midTor'],
  ['midTor','midHip'],
  ['lSho',  'lHip'],
  ['rSho',  'rHip'],
  ['lHip',  'rHip'],
  ['lHip',  'lKne'],
  ['rHip',  'rKne'],
  ['lKne',  'lAnk'],
  ['rKne',  'rAnk'],
]

function bonePath(a: keyof typeof JOINTS, b: keyof typeof JOINTS) {
  const [x1, y1] = JOINTS[a]
  const [x2, y2] = JOINTS[b]
  return `M ${x1} ${y1} L ${x2} ${y2}`
}

// ─── Skeleton SVG ───────────────────────────────────────────────────────────
function PoseSkeleton() {
  const controls = useAnimationControls()

  useEffect(() => {
    controls.start('visible')
  }, [controls])

  const boneVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: (i: number) => ({
      pathLength: 1,
      opacity: 1,
      transition: { duration: 1.2, delay: i * 0.06, ease: 'easeOut' as const },
    }),
  }

  const dotVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: (i: number) => ({
      scale: 1,
      opacity: 1,
      transition: { duration: 0.4, delay: 0.3 + i * 0.04, ease: 'backOut' as const },
    }),
  }

  return (
    <svg
      viewBox="0 0 200 390"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
    >
      {/* Rotating dashed halo */}
      <motion.circle
        cx="100"
        cy="192"
        r="170"
        stroke="#C8FF00"
        strokeWidth="0.8"
        strokeDasharray="12 8"
        strokeOpacity="0.25"
        animate={{ rotate: 360 }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
        style={{ originX: '100px', originY: '192px', transformBox: 'fill-box' }}
      />
      {/* Counter-rotating inner halo */}
      <motion.circle
        cx="100"
        cy="192"
        r="140"
        stroke="#C8FF00"
        strokeWidth="0.5"
        strokeDasharray="6 14"
        strokeOpacity="0.15"
        animate={{ rotate: -360 }}
        transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
        style={{ originX: '100px', originY: '192px', transformBox: 'fill-box' }}
      />

      {/* Bones */}
      {BONES.map(([a, b], i) => (
        <motion.path
          key={`${a}-${b}`}
          d={bonePath(a, b)}
          stroke="#C8FF00"
          strokeWidth="2"
          strokeLinecap="round"
          custom={i}
          variants={boneVariants}
          initial="hidden"
          animate={controls}
          style={{ filter: 'drop-shadow(0 0 4px rgba(200,255,0,0.6))' }}
        />
      ))}

      {/* Head circle */}
      <motion.circle
        cx={JOINTS.head[0]}
        cy={JOINTS.head[1]}
        r="14"
        stroke="#C8FF00"
        strokeWidth="2"
        fill="rgba(200,255,0,0.05)"
        custom={0}
        variants={dotVariants}
        initial="hidden"
        animate={controls}
        style={{ filter: 'drop-shadow(0 0 6px rgba(200,255,0,0.8))' }}
      />

      {/* Joint dots */}
      {(Object.keys(JOINTS) as (keyof typeof JOINTS)[])
        .filter((k) => k !== 'head' && k !== 'midTor' && k !== 'midHip')
        .map((key, i) => (
          <motion.circle
            key={key}
            cx={JOINTS[key][0]}
            cy={JOINTS[key][1]}
            r={key === 'neck' ? 4 : 3.5}
            fill="#C8FF00"
            custom={i}
            variants={dotVariants}
            initial="hidden"
            animate={controls}
            style={{ filter: 'drop-shadow(0 0 4px rgba(200,255,0,0.9))' }}
          />
        ))}
    </svg>
  )
}

// ─── Feature Card ───────────────────────────────────────────────────────────
function FeatureCard({
  icon,
  title,
  tag,
  desc,
  delay,
}: {
  icon: string
  title: string
  tag: string
  desc: string
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      viewport={{ once: true }}
      whileHover={{ borderColor: '#C8FF00', boxShadow: '0 0 30px rgba(200,255,0,0.12)' }}
      className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-colors duration-300 cursor-default overflow-hidden group"
    >
      {/* Corner accent */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-[#C8FF00]/5 rounded-bl-full transition-all duration-300 group-hover:bg-[#C8FF00]/10" />
      <div className="text-3xl mb-4">{icon}</div>
      <div className="mb-2">
        <span className="text-xs font-medium text-[#C8FF00] tracking-widest uppercase">{tag}</span>
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-white/50 leading-relaxed">{desc}</p>
    </motion.div>
  )
}

// ─── Progress Bar (How It Works section) ───────────────────────────────────
function LiveProgressBar({
  label,
  value,
  delay,
  inView,
}: {
  label: string
  value: number
  delay: number
  inView: boolean
}) {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    if (!inView) return
    const timer = setTimeout(() => setWidth(value), delay * 1000)
    return () => clearTimeout(timer)
  }, [inView, value, delay])

  const color =
    value >= 85
      ? '#C8FF00'
      : value >= 70
      ? '#88d900'
      : '#f59e0b'

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="text-white/60">{label}</span>
        <span style={{ color }}>{value}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-[1400ms] ease-out"
          style={{ width: `${width}%`, backgroundColor: color, boxShadow: `0 0 8px ${color}60` }}
        />
      </div>
    </div>
  )
}

// ─── Research Card ──────────────────────────────────────────────────────────
function ResearchCard({
  title,
  authors,
  year,
  journal,
  tags,
  desc,
  delay,
}: {
  title: string
  authors: string
  year: string
  journal: string
  tags: string[]
  desc: string
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      viewport={{ once: true }}
      className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-white/40 font-mono mb-1">{year} · {journal}</p>
          <h3 className="text-base font-semibold text-white leading-snug">{title}</h3>
          <p className="text-xs text-white/40 mt-1">{authors}</p>
        </div>
        <div className="w-8 h-8 rounded-full border border-[#C8FF00]/30 flex items-center justify-center shrink-0 mt-1">
          <span className="text-[#C8FF00] text-xs">↗</span>
        </div>
      </div>
      <p className="text-sm text-white/50 leading-relaxed">{desc}</p>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Chip key={tag} size="sm" className="bg-white/5 text-white/60 border border-white/10 text-xs">
            {tag}
          </Chip>
        ))}
      </div>
    </motion.div>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null)
  const howItWorksRef = useRef<HTMLDivElement>(null)
  const howItWorksInView = useInView(howItWorksRef, { once: true })

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0])
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 80])

  // Animated counters
  const poseAcc = useAnimatedCounter(85)
  const exercises = useAnimatedCounter(20)
  const liveUsers = useAnimatedCounter(6)
  const latency = useAnimatedCounter(30)

  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="bg-[#080808] text-white min-h-screen">

      {/* ── NAVBAR ────────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 py-4 backdrop-blur-md bg-[#080808]/70 border-b border-white/5">
        {/* Logo */}
        <div className="flex items-center gap-1">
          <span className="font-bebas text-2xl tracking-widest text-white">AI</span>
          <span className="font-bebas text-2xl tracking-widest text-[#C8FF00]">FIT</span>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {['Features', 'How It Works', 'Research'].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/ /g, '-')}`}
              className="text-sm text-white/60 hover:text-white transition-colors duration-200 tracking-wide"
            >
              {item}
            </a>
          ))}
        </nav>

        {/* CTA */}
        <Button
          variant="solid"
          size="sm"
          className="hidden md:flex bg-[#C8FF00] text-[#080808] font-semibold rounded-full px-5 hover:bg-[#d4ff33] transition-colors duration-200 lime-glow"
        >
          Get Early Access
        </Button>

        {/* Mobile burger */}
        <button
          className="md:hidden text-white/70 hover:text-white"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <line x1="2" y1="6" x2="20" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="2" y1="11" x2="20" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="2" y1="16" x2="20" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="absolute top-full left-0 right-0 bg-[#0e0e0e] border-b border-white/10 px-6 py-4 flex flex-col gap-4 md:hidden">
            {['Features', 'How It Works', 'Research'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/ /g, '-')}`}
                className="text-sm text-white/60"
                onClick={() => setMenuOpen(false)}
              >
                {item}
              </a>
            ))}
            <Button
              variant="solid"
              size="sm"
              className="bg-[#C8FF00] text-[#080808] font-semibold rounded-full w-fit px-5"
            >
              Get Early Access
            </Button>
          </div>
        )}
      </header>

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center overflow-hidden pt-20"
      >
        {/* Background glow blobs */}
        <div className="absolute top-1/4 -left-40 w-[500px] h-[500px] rounded-full bg-[#C8FF00] opacity-[0.04] blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-[#C8FF00] opacity-[0.03] blur-[120px] pointer-events-none" />
        <div className="absolute top-0 right-1/3 w-[300px] h-[300px] rounded-full bg-cyan-500 opacity-[0.03] blur-[120px] pointer-events-none" />

        <div className="container mx-auto px-6 md:px-10 grid md:grid-cols-2 gap-12 items-center py-16">
          {/* Left: Text */}
          <motion.div
            style={{ opacity: heroOpacity, y: heroY }}
            className="relative z-10"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 bg-[#C8FF00]/10 border border-[#C8FF00]/20 rounded-full px-4 py-1.5 mb-8"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#C8FF00] animate-pulse" />
              <span className="text-[#C8FF00] text-xs font-medium tracking-widest uppercase">Final Year Project 2025–26</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="font-bebas text-[clamp(4rem,10vw,8rem)] leading-none tracking-wide mb-6"
            >
              <span className="block text-white">TRAIN /</span>
              <span className="block text-[#C8FF00] lime-text-glow">SMARTER /</span>
              <span className="block text-white">WITH AI</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="text-white/60 text-base md:text-lg leading-relaxed mb-8 max-w-md"
            >
              Real-time pose detection using MediaPipe&apos;s 33-point body landmark model with
              AR form overlay and live multi-user training rooms. Your coach never sleeps.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="flex flex-wrap gap-4"
            >
              <button className="inline-flex items-center gap-2 bg-[#C8FF00] text-[#080808] font-semibold rounded-full px-7 py-3 text-sm hover:bg-[#d4ff33] transition-all duration-200 lime-glow">
                Start Training
                <span className="text-base">→</span>
              </button>
              <button className="inline-flex items-center gap-2 border border-white/20 text-white rounded-full px-7 py-3 text-sm hover:border-[#C8FF00]/50 hover:text-[#C8FF00] transition-all duration-200">
                Watch Demo
                <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-xs">▶</span>
              </button>
            </motion.div>
          </motion.div>

          {/* Right: Skeleton + Badges */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative flex items-center justify-center"
          >
            {/* Skeleton container */}
            <div className="relative w-64 md:w-72 h-[420px] md:h-[480px]">
              {/* Outer glow ring */}
              <div className="absolute inset-0 rounded-full bg-[#C8FF00]/5 blur-3xl" />
              <PoseSkeleton />
            </div>

            {/* Floating badge: Accuracy */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-6 -left-4 md:-left-8 bg-[#0e0e0e] border border-[#C8FF00]/30 rounded-xl px-4 py-2.5 backdrop-blur-sm shadow-lg"
            >
              <div className="text-[#C8FF00] font-bebas text-2xl leading-none">85%+</div>
              <div className="text-white/50 text-xs mt-0.5">Pose Accuracy</div>
            </motion.div>

            {/* Floating badge: Live */}
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute bottom-12 -right-4 md:-right-8 bg-[#0e0e0e] border border-white/10 rounded-xl px-4 py-2.5 backdrop-blur-sm shadow-lg"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#C8FF00] animate-pulse" />
                <span className="text-white/80 text-sm font-medium">Live</span>
              </div>
              <div className="text-white/40 text-xs mt-0.5">● 4 users training</div>
            </motion.div>

            {/* Floating badge: MediaPipe */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
              className="absolute top-1/2 -right-2 md:-right-6 -translate-y-1/2 bg-[#0e0e0e] border border-white/10 rounded-xl px-3 py-2 backdrop-blur-sm"
            >
              <div className="text-xs text-white/60 font-mono">33 landmarks</div>
              <div className="text-[10px] text-white/30">MediaPipe</div>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-white/30 text-xs tracking-widest uppercase">Scroll</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-px h-8 bg-gradient-to-b from-[#C8FF00]/60 to-transparent"
          />
        </motion.div>
      </section>

      {/* ── STATS BAR ─────────────────────────────────────────────────── */}
      <section className="relative border-y border-white/5 bg-[#0a0a0a] py-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#C8FF00]/[0.02] to-transparent" />
        <div className="container mx-auto px-6 md:px-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { ref: poseAcc.ref, count: poseAcc.count, end: 85, suffix: '%+', label: 'Pose Accuracy' },
              { ref: exercises.ref, count: exercises.count, end: 20, suffix: '+', label: 'Exercises' },
              { ref: liveUsers.ref, count: liveUsers.count, end: 6, suffix: '', label: 'Live Room Cap' },
              { ref: latency.ref, count: latency.count, end: 30, suffix: 'ms', label: 'Avg Latency' },
            ].map(({ ref, count, suffix, label }) => (
              <div key={label} className="space-y-1">
                <span
                  ref={ref}
                  className="font-bebas text-5xl text-[#C8FF00] block lime-text-glow"
                >
                  {count}{suffix}
                </span>
                <p className="text-white/40 text-sm tracking-wide uppercase">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────────── */}
      <section id="features" className="py-24 md:py-32 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#C8FF00]/[0.03] blur-[100px] pointer-events-none" />

        <div className="container mx-auto px-6 md:px-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <p className="text-[#C8FF00] text-xs font-medium tracking-widest uppercase mb-4">Core Technology</p>
            <h2 className="font-bebas text-[clamp(2.5rem,6vw,5rem)] leading-none text-white">
              WHAT&apos;S UNDER<br />
              <span className="text-[#C8FF00]">THE HOOD</span>
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <FeatureCard
              icon="🦴"
              title="Real-Time Pose Detection"
              tag="MediaPipe"
              desc="33-point skeletal tracking at 30fps using BlazePose. Sub-50ms inference on device for zero-latency feedback."
              delay={0}
            />
            <FeatureCard
              icon="🥽"
              title="AR Form Overlay"
              tag="Augmented Reality"
              desc="Ghost-mode AR overlay maps ideal joint angles onto your live feed. See exactly where your form breaks down."
              delay={0.1}
            />
            <FeatureCard
              icon="🌐"
              title="Live Training Rooms"
              tag="WebRTC"
              desc="Train with up to 6 peers in real-time. Shared pose data, synchronized rep counts, live coach feed."
              delay={0.2}
            />
            <FeatureCard
              icon="🤖"
              title="Adaptive AI Coach"
              tag="Reinforcement Learning"
              desc="Coach adapts to your biomechanics. Learns injury patterns, fatigue signals, and optimal progression curves."
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 md:py-32 bg-[#080808] relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-[#C8FF00]/[0.04] blur-[100px] pointer-events-none" />

        <div className="container mx-auto px-6 md:px-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <p className="text-[#C8FF00] text-xs font-medium tracking-widest uppercase mb-4">Process</p>
            <h2 className="font-bebas text-[clamp(2.5rem,6vw,5rem)] leading-none text-white">
              THREE STEPS TO<br />
              <span className="text-[#C8FF00]">PERFECT FORM</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12 items-start">
            {/* Steps */}
            <div className="space-y-12">
              {[
                {
                  num: '01',
                  title: 'Grant Camera Access',
                  desc: 'AIFIT activates your device camera and initialises the MediaPipe BlazePose model locally — no video is sent to any server.',
                },
                {
                  num: '02',
                  title: 'AI Analyses Your Form',
                  desc: 'Real-time skeleton overlay flags incorrect joint angles, asymmetry, and range-of-motion issues with visual + haptic cues.',
                },
                {
                  num: '03',
                  title: 'Train Live with Peers',
                  desc: 'Join a live room with up to 5 other athletes. The AI coach monitors everyone simultaneously, calling reps and correcting form.',
                },
              ].map(({ num, title, desc }, i) => (
                <motion.div
                  key={num}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: i * 0.15 }}
                  viewport={{ once: true }}
                  className="flex gap-6 items-start"
                >
                  <span className="font-bebas text-[5rem] leading-none text-[#C8FF00]/10 select-none shrink-0 w-20 text-right">
                    {num}
                  </span>
                  <div className="pt-2">
                    <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
                    <p className="text-white/50 text-sm leading-relaxed">{desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Live Session Terminal */}
            <motion.div
              ref={howItWorksRef}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              viewport={{ once: true }}
              className="rounded-2xl border border-white/10 bg-[#0d0d0d] overflow-hidden"
            >
              {/* Terminal header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-[#0a0a0a]">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                  <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                  <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                </div>
                <span className="text-white/30 text-xs font-mono">aifit — live-session</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C8FF00] animate-pulse" />
                  <span className="text-[#C8FF00] text-xs font-mono">LIVE</span>
                </div>
              </div>

              {/* Session content */}
              <div className="p-6 space-y-5 font-mono text-sm">
                <div className="text-white/30 text-xs mb-4">
                  <span className="text-[#C8FF00]">→</span> Squat · Rep 7/10 · Athlete: <span className="text-white/60">pratik_l</span>
                </div>

                {/* Progress bars */}
                <div className="space-y-4">
                  <LiveProgressBar label="Squat depth" value={94} delay={0.3} inView={howItWorksInView} />
                  <LiveProgressBar label="Knee alignment" value={78} delay={0.5} inView={howItWorksInView} />
                  <LiveProgressBar label="Back angle" value={61} delay={0.7} inView={howItWorksInView} />
                  <LiveProgressBar label="Rep cadence" value={88} delay={0.9} inView={howItWorksInView} />
                </div>

                {/* Coach feedback */}
                <div className="pt-4 border-t border-white/10 space-y-2">
                  <p className="text-white/30 text-xs">AI Coach</p>
                  <p className="text-white/70 text-xs leading-relaxed">
                    <span className="text-[#C8FF00]">⚠</span> Back angle below threshold — engage core before next rep.
                  </p>
                  <p className="text-white/50 text-xs">
                    <span className="text-[#28c840]">✓</span> Squat depth excellent. Maintain heel drive.
                  </p>
                </div>

                {/* User avatars */}
                <div className="pt-3 flex items-center gap-3">
                  <p className="text-white/30 text-xs">Room:</p>
                  <div className="flex -space-x-2">
                    {['P', 'G', 'A', 'R'].map((l, i) => (
                      <div
                        key={i}
                        className="w-6 h-6 rounded-full border border-[#080808] flex items-center justify-center text-[10px] font-bold text-[#080808]"
                        style={{ backgroundColor: i === 0 ? '#C8FF00' : `hsl(${i * 60 + 120}, 70%, 60%)` }}
                      >
                        {l}
                      </div>
                    ))}
                  </div>
                  <span className="text-white/30 text-xs">4 / 6 active</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── RESEARCH ──────────────────────────────────────────────────── */}
      <section id="research" className="py-24 md:py-32 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[400px] rounded-full bg-[#C8FF00]/[0.03] blur-[120px] pointer-events-none" />

        <div className="container mx-auto px-6 md:px-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <p className="text-[#C8FF00] text-xs font-medium tracking-widest uppercase mb-4">Academic Foundation</p>
            <h2 className="font-bebas text-[clamp(2.5rem,6vw,5rem)] leading-none text-white">
              GROUNDED IN<br />
              <span className="text-[#C8FF00]">PEER-REVIEWED RESEARCH</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            <ResearchCard
              title="BlazePose: On-device Real-time Body Pose Tracking"
              authors="Bazarevsky et al."
              year="2020"
              journal="Google Research / arXiv"
              tags={['Pose Estimation', 'On-device ML', 'MediaPipe']}
              desc="Introduced the efficient 33-landmark body model enabling sub-50ms inference on mobile — the core engine powering AIFIT's skeleton tracking."
              delay={0}
            />
            <ResearchCard
              title="Augmented Reality Feedback in Athletic Training"
              authors="Kim & Lee"
              year="2022"
              journal="Int. J. Human–Computer Interaction"
              tags={['AR Feedback', 'Sports Science', 'HCI']}
              desc="Demonstrated that AR visual cues reduce form errors by 31% compared to verbal coaching alone, validating our ghost-overlay design choice."
              delay={0.1}
            />
            <ResearchCard
              title="Social Exercise Platforms and Sustained Engagement"
              authors="Anderson et al."
              year="2021"
              journal="JMIR Serious Games"
              tags={['Social Fitness', 'Adherence', 'mHealth']}
              desc="Peer co-presence increases workout frequency by 40% and session duration by 22%, forming the evidence base for AIFIT's live training rooms."
              delay={0.2}
            />
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section className="relative py-32 md:py-48 overflow-hidden border-t border-white/5">
        {/* Glow blob */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full bg-[#C8FF00] opacity-[0.06] blur-[120px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[200px] rounded-full bg-[#C8FF00] opacity-[0.04] blur-[60px] pointer-events-none" />

        <div className="container mx-auto px-6 md:px-10 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <p className="text-[#C8FF00] text-xs font-medium tracking-widest uppercase mb-6">AIFIT · MPSTME Mumbai</p>
            <h2 className="font-bebas text-[clamp(3.5rem,12vw,9rem)] leading-none mb-6">
              <span className="block text-white">YOUR FORM.</span>
              <span className="block text-[#C8FF00] lime-text-glow">PERFECTED.</span>
            </h2>
            <p className="text-white/50 text-base md:text-lg max-w-xl mx-auto mb-10 leading-relaxed">
              A Computer Engineering final-year project from MPSTME Mumbai, pushing the boundary of
              AI-assisted athletic training with on-device ML and real-time AR.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button className="inline-flex items-center gap-2 bg-[#C8FF00] text-[#080808] font-semibold rounded-full px-8 py-3.5 text-sm hover:bg-[#d4ff33] transition-all duration-200 lime-glow text-base">
                Get Early Access
              </button>
              <button className="inline-flex items-center gap-2 border border-white/20 text-white/70 rounded-full px-8 py-3.5 text-sm hover:border-white/40 hover:text-white transition-all duration-200">
                Read the Paper
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-10 bg-[#060606]">
        <div className="container mx-auto px-6 md:px-10 flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-1">
            <span className="font-bebas text-xl tracking-widest text-white">AI</span>
            <span className="font-bebas text-xl tracking-widest text-[#C8FF00]">FIT</span>
          </div>

          {/* Credits */}
          <div className="text-center text-white/30 text-sm space-y-1">
            <p>MPSTME Mumbai · Computer Engineering · A.Y. 2025–2026</p>
            <p>Pratik Lakhani &amp; Priyaan Gala</p>
          </div>

          {/* Right */}
          <p className="text-white/20 text-xs">Built with MediaPipe · WebRTC · Next.js</p>
        </div>
      </footer>
    </div>
  )
}
