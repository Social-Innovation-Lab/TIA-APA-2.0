import 'regenerator-runtime/runtime';
import type { AppProps } from 'next/app';
import '../styles/globals.css';
import { useState, useRef, useEffect } from 'react';
import { MicrophoneIcon, PaperAirplaneIcon, PhotoIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import axios from 'axios';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

export default function App({ Component, pageProps }: AppProps) {
    return <Component {...pageProps} />;
}