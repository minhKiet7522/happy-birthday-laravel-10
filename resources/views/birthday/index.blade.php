@extends('layouts.app')

@section('content')
    {{-- ═══════════════════════════════════════════
         Song Data — read by birthday.js on init
         ═══════════════════════════════════════════ --}}
    <script type="application/json" id="song-data">@json($songs)</script>

    {{-- ═══════════════════════════════════════════
         Hidden YouTube Player (audio-only)
         ═══════════════════════════════════════════ --}}
    <div id="youtube-player-wrap" style="position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;overflow:hidden;pointer-events:none;">
        <div id="yt-player"></div>
    </div>

    {{-- ═══════════════════════════════════════════
         Animated Background
         ═══════════════════════════════════════════ --}}
    <div class="bg-animated" aria-hidden="true"></div>

    {{-- ═══════════════════════════════════════════
         Starfield (CSS box-shadow, no JS needed)
         ═══════════════════════════════════════════ --}}
    <div class="starfield" aria-hidden="true">
        <div class="starfield__layer starfield__layer--small"></div>
        <div class="starfield__layer starfield__layer--medium"></div>
        <div class="starfield__layer starfield__layer--large"></div>
    </div>

    {{-- ═══════════════════════════════════════════
         Particles Container
         ═══════════════════════════════════════════ --}}
    <div class="particles-container" id="particles-container" aria-hidden="true"></div>

    {{-- ═══════════════════════════════════════════
         OVERLAY — "Click để mở quà"
         ═══════════════════════════════════════════ --}}
    <div class="overlay" id="overlay" role="button" tabindex="0" aria-label="Nhấn để mở quà sinh nhật">
        {{-- 3D Gift Box --}}
        <div class="gift-box" id="gift-box" aria-hidden="true">
            {{-- Light burst behind gift --}}
            <div class="gift-box__burst" id="gift-burst"></div>

            {{-- Lid --}}
            <div class="gift-box__lid" id="gift-lid">
                <div class="gift-box__lid-face"></div>
                <div class="gift-box__lid-ribbon"></div>
                {{-- Bow --}}
                <div class="gift-box__bow">
                    <div class="gift-box__bow-loop gift-box__bow-loop--left"></div>
                    <div class="gift-box__bow-loop gift-box__bow-loop--right"></div>
                    <div class="gift-box__bow-knot"></div>
                </div>
            </div>

            {{-- Base --}}
            <div class="gift-box__base">
                <div class="gift-box__base-face"></div>
                <div class="gift-box__base-ribbon"></div>
            </div>
        </div>

        <h2 class="overlay__title" id="overlay-title">Bạn có một món quà đặc biệt!</h2>
        <p class="overlay__subtitle" id="overlay-subtitle">✨ Nhấn để mở ✨</p>
    </div>

    {{-- ═══════════════════════════════════════════
         MAIN CONTENT
         ═══════════════════════════════════════════ --}}
    <main id="main-content"
        class="relative z-10 flex flex-col items-center justify-center
               min-h-screen pb-24 opacity-0 pointer-events-none
               transition-opacity duration-700 ease-in-out">

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
                        {{-- Check for user's photo: anh.jpg → friend-photo.jpg → friend-photo.png → initials --}}
                        @if (file_exists(public_path('assets/images/anh.jpg')))
                            <img class="vinyl__label-photo" src="{{ asset('assets/images/anh.jpg') }}"
                                alt="{{ $name }}" loading="eager">
                        @elseif(file_exists(public_path('assets/images/friend-photo.jpg')))
                            <img class="vinyl__label-photo" src="{{ asset('assets/images/friend-photo.jpg') }}"
                                alt="{{ $name }}" loading="eager">
                        @elseif(file_exists(public_path('assets/images/friend-photo.png')))
                            <img class="vinyl__label-photo" src="{{ asset('assets/images/friend-photo.png') }}"
                                alt="{{ $name }}" loading="eager">
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
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
                </svg>
            </button>

            {{-- Play / Pause --}}
            <button class="player-btn player-btn--play" id="play-btn" aria-label="Phát / Tạm dừng" title="Phát / Tạm dừng">
                <svg class="icon-play" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                </svg>
                <svg class="icon-pause hidden" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
            </button>

            {{-- Next --}}
            <button class="player-btn" id="next-btn" aria-label="Bài tiếp" title="Bài tiếp">
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 18l8.5-6L6 6v12zm10-12v12h2V6h-2z" />
                </svg>
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
