@extends('layouts.app')

@section('content')

    {{-- ═══════════════════════════════════════════
         Song Data — read by birthday.js on init
         ═══════════════════════════════════════════ --}}
    <script type="application/json" id="song-data">@json($songs)</script>

    {{-- ═══════════════════════════════════════════
         Animated Background
         ═══════════════════════════════════════════ --}}
    <div class="bg-animated" aria-hidden="true"></div>

    {{-- ═══════════════════════════════════════════
         Particles Container
         ═══════════════════════════════════════════ --}}
    <div class="particles-container" id="particles-container" aria-hidden="true"></div>

    {{-- ═══════════════════════════════════════════
         OVERLAY — "Click để mở quà"
         ═══════════════════════════════════════════ --}}
    <div class="overlay" id="overlay" role="button" tabindex="0" aria-label="Nhấn để mở quà sinh nhật">
        {{-- Gift icon --}}
        <div class="overlay__gift" aria-hidden="true">🎁</div>

        <h2 class="overlay__title">Bạn có một món quà đặc biệt!</h2>
        <p class="overlay__subtitle">✨ Nhấn để mở ✨</p>
    </div>

    {{-- ═══════════════════════════════════════════
         MAIN CONTENT
         ═══════════════════════════════════════════ --}}
    <main
        id="main-content"
        class="relative z-10 flex flex-col items-center justify-center
               min-h-screen pb-24 opacity-0 pointer-events-none
               transition-opacity duration-700 ease-in-out"
    >

        {{-- ── Birthday Header ── --}}
        <header class="birthday-header">
            <h1 class="birthday-header__title">Happy Birthday</h1>
            <h2 class="birthday-header__name">{{ $name }}</h2>
            <div class="birthday-header__line"></div>
        </header>

        {{-- ── Turntable ── --}}
        <section class="turntable-section" aria-label="Turntable">
            <div class="turntable-container">

                {{-- Tonearm --}}
                <div class="tonearm" id="tonearm">
                    <div class="tonearm__arm">
                        <div class="tonearm__head"></div>
                        <div class="tonearm__pivot"></div>
                    </div>
                </div>

                {{-- Vinyl Record --}}
                <div class="vinyl" id="vinyl-record">
                    <div class="vinyl__grooves"></div>
                    <div class="vinyl__shine"></div>

                    {{-- Centre label --}}
                    <div class="vinyl__label">
                        {{-- If the user placed a photo, show it; otherwise show initials --}}
                        @if(file_exists(public_path('assets/images/friend-photo.jpg')))
                            <img
                                class="vinyl__label-photo"
                                src="{{ asset('assets/images/friend-photo.jpg') }}"
                                alt="{{ $name }}"
                                loading="eager"
                            >
                        @elseif(file_exists(public_path('assets/images/friend-photo.png')))
                            <img
                                class="vinyl__label-photo"
                                src="{{ asset('assets/images/friend-photo.png') }}"
                                alt="{{ $name }}"
                                loading="eager"
                            >
                        @else
                            <span class="vinyl__label-initials">MN</span>
                        @endif
                        <span class="vinyl__label-subtitle">Happy Birthday</span>
                    </div>

                    <div class="vinyl__hole"></div>
                </div>

            </div>
        </section>

        {{-- ── Birthday Message ── --}}
        <section class="message-section">
            <p class="message-section__text">{{ $message }}</p>
            <span class="message-section__emoji" aria-hidden="true">💕 🎂 🎉 🎈</span>
        </section>

    </main>

    {{-- ═══════════════════════════════════════════
         MUSIC PLAYER  (Glassmorphism bar)
         ═══════════════════════════════════════════ --}}
    <aside class="music-player" id="music-player" aria-label="Trình phát nhạc">

        {{-- Controls --}}
        <div class="player-controls">
            {{-- Previous --}}
            <button class="player-btn" id="prev-btn" aria-label="Bài trước" title="Bài trước">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
            </button>

            {{-- Play / Pause --}}
            <button class="player-btn player-btn--play" id="play-btn" aria-label="Phát / Tạm dừng" title="Phát / Tạm dừng">
                <svg class="icon-play" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                <svg class="icon-pause hidden" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            </button>

            {{-- Next --}}
            <button class="player-btn" id="next-btn" aria-label="Bài tiếp" title="Bài tiếp">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zm10-12v12h2V6h-2z"/></svg>
            </button>
        </div>

        {{-- Song info + progress --}}
        <div class="player-info">
            <div class="flex items-center justify-between">
                <span class="player-info__title" id="song-title">Đang tải…</span>
                <span class="player-info__time" id="time-display">0:00 / 0:00</span>
            </div>
            <div class="progress-container" id="progress-container">
                <div class="progress-bar" id="progress-bar"></div>
            </div>
        </div>

        {{-- Mini equaliser --}}
        <div class="equalizer" id="equalizer" aria-hidden="true">
            <div class="equalizer__bar"></div>
            <div class="equalizer__bar"></div>
            <div class="equalizer__bar"></div>
            <div class="equalizer__bar"></div>
            <div class="equalizer__bar"></div>
        </div>
    </aside>

@endsection
