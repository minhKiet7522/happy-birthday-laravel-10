<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class BirthdayController extends Controller
{
    /**
     * Hiển thị trang chúc mừng sinh nhật.
     *
     * Tùy chỉnh tên, lời chúc, và danh sách bài hát tại đây.
     */
    public function index()
    {
        $name = 'Mộng Như';

        $message = 'Chúc ' . $name . ' một ngày sinh nhật thật vui vẻ và tràn đầy hạnh phúc! '
                 . 'Mong rằng năm mới tuổi sẽ mang đến cho bạn thật nhiều niềm vui, sức khỏe và may mắn. '
                 . 'Cảm ơn bạn vì đã luôn là một người bạn tuyệt vời!';

        $songs = [
            [
                'title' => 'Happy Birthday To You',
                'file'  => asset('assets/music/happy-birthday-1.mp3'),
            ],
            [
                'title' => 'Chúc Mừng Sinh Nhật',
                'file'  => asset('assets/music/happy-birthday-2.mp3'),
            ],
            [
                'title' => 'Birthday Melody',
                'file'  => asset('assets/music/happy-birthday-3.mp3'),
            ],
        ];

        return view('birthday.index', compact('name', 'message', 'songs'));
    }
}
