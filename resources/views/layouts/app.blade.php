<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
    <meta name="description" content="Happy Birthday {{ $name }}! 🎂 Một món quà sinh nhật đặc biệt dành cho bạn.">
    <meta name="theme-color" content="#0f0a1e">
    <title>🎂 Happy Birthday {{ $name }}! 🎉</title>

    {{-- Google Fonts --}}
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">

    {{-- Tailwind CSS v3 – Play CDN --}}
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        display: ['Dancing Script', 'cursive'],
                        body:    ['Outfit', 'sans-serif'],
                    },
                },
            },
        };
    </script>

    {{-- Custom Styles --}}
    <link rel="stylesheet" href="{{ asset('assets/css/birthday.css') }}">

    @yield('styles')
</head>
<body class="font-body music-paused">

    @yield('content')

    {{-- Custom Scripts --}}
    <script src="{{ asset('assets/js/birthday.js') }}"></script>

    @yield('scripts')
</body>
</html>
