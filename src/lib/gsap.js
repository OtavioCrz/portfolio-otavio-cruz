import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, useGSAP)

/* Sem lag smoothing: o scrub acompanha o scroll real, sem "pulos" */
gsap.ticker.lagSmoothing(0)

/* A barra de URL do mobile dispara resize e faria o pin recalcular
   no meio da animacao — ignoramos esse caso especifico. */
ScrollTrigger.config({ ignoreMobileResize: true })

export { gsap, ScrollTrigger, useGSAP }
