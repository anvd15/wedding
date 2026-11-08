'use client';

import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import {
  Volume2,
  VolumeX,
  Heart,
  Calendar as CalendarIcon,
  MapPin,
  Clock,
  Send,
  ChevronLeft,
  ChevronRight,
  X,
  Share2,
} from 'lucide-react';

// Trỏ trực tiếp tới Backend Cloudflare HTTPS
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.anvd.dev';

// Ảnh local dùng tạm trong lúc chờ API /api/photos trả dữ liệu (hoặc khi API lỗi)
const FALLBACK_SLIDER_PHOTOS = [
  '/photos/slide-01.jpg',
  '/photos/slide-02.jpg',
  '/photos/slide-03.jpg',
  '/photos/slide-04.jpg',
  '/photos/slide-05.jpg',
  '/photos/slide-06.jpg',
];
const FALLBACK_HERO_PHOTO = '/photos/DSC_1220.jpg';
const FALLBACK_GROOM_PHOTO = '/photos/DSC_1415.jpg';
const FALLBACK_BRIDE_PHOTO = '/photos/DSC_1332.jpg';

export default function WeddingPage() {
  // Trạng thái màn hình "thiệp đóng" (envelope cover) hiển thị khi vào trang
  const [inviteOpened, setInviteOpened] = useState(false);
  const [isOpeningInvite, setIsOpeningInvite] = useState(false);

  // Trạng thái âm nhạc
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  // Trạng thái đếm ngược (Mục tiêu: Ngày 20 tháng 11 năm 2026 hoặc thời điểm cưới)
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentPhotoIdx, setCurrentPhotoIdx] = useState(0);

  // Slide ảnh cưới kiểu "coverflow" ở trang chủ
  const [sliderIndex, setSliderIndex] = useState(0);
  const [sliderPaused, setSliderPaused] = useState(false);
  const touchStartXRef = useRef(null);

  // Ảnh tải từ API /api/photos (S3) - khởi tạo bằng ảnh local để không bị trống khi chờ tải
  const [sliderPhotos, setSliderPhotos] = useState(
    FALLBACK_SLIDER_PHOTOS.map((url) => ({ url }))
  );
  const [heroPhotoUrl, setHeroPhotoUrl] = useState(FALLBACK_HERO_PHOTO);
  const [groomPhotoUrl, setGroomPhotoUrl] = useState(FALLBACK_GROOM_PHOTO);
  const [bridePhotoUrl, setBridePhotoUrl] = useState(FALLBACK_BRIDE_PHOTO);

  // Form RSVP
  const [rsvpName, setRsvpName] = useState('');
  const [rsvpGuestType, setRsvpGuestType] = useState('groom'); // groom | bride
  const [rsvpAttending, setRsvpAttending] = useState('yes');
  const [rsvpCount, setRsvpCount] = useState('1');
  const [rsvpWishes, setRsvpWishes] = useState('');
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);
  const [isSubmittingRsvp, setIsSubmittingRsvp] = useState(false);

  // Sổ lưu bút (Wishes list) & Realtime
  const [wishes, setWishes] = useState([]);
  const [newWishName, setNewWishName] = useState('');
  const [newWishSide, setNewWishSide] = useState('Bạn bè');
  const [newWishContent, setNewWishContent] = useState('');
  const [isSubmittingWish, setIsSubmittingWish] = useState(false);
  const [onlineCount, setOnlineCount] = useState(1);
  const [socketConnected, setSocketConnected] = useState(false);
  const [justAddedWishId, setJustAddedWishId] = useState(null);
  const [wishTickerPaused, setWishTickerPaused] = useState(false);

  // Bật nhạc tự động khi người dùng tương tác lần đầu
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (audioRef.current && !isPlaying) {
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(() => {});
      }
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };

    window.addEventListener('click', handleFirstInteraction);
    window.addEventListener('touchstart', handleFirstInteraction);

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, [isPlaying]);

  // Khoá cuộn trang khi màn hình thiệp đóng còn hiển thị
  useEffect(() => {
    document.body.style.overflow = inviteOpened ? '' : 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [inviteOpened]);

  // Mở thiệp: chạy hiệu ứng (phong bì mở ra) rồi mới lộ nội dung chính
  const handleOpenInvite = () => {
    if (isOpeningInvite || inviteOpened) return;
    setIsOpeningInvite(true);
    setTimeout(() => setInviteOpened(true), 1550);
  };

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => console.log('Audio error:', err));
    }
  };

  // Countdown timer tính đến ngày 29 Tháng 11
  useEffect(() => {
    const targetDate = new Date('2026-11-29T09:00:00+07:00').getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setCountdown({ days, hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  // Cánh hoa rơi lãng mạn (Falling petals effect)
  useEffect(() => {
    const canvas = document.getElementById('petals-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const onResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    const petals = [];
    const petalCount = 22;

    for (let i = 0; i < petalCount; i++) {
      petals.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: 8 + Math.random() * 8,
        speedY: 0.8 + Math.random() * 1.4,
        speedX: (Math.random() - 0.5) * 1.2,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 2,
        opacity: 0.4 + Math.random() * 0.4,
        color: Math.random() > 0.4 ? '#f7a8b8' : '#ffd1dc', // Tông hồng phớt cánh đào
      });
    }

    let animationFrameId;
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      petals.forEach((p) => {
        p.y += p.speedY;
        p.x += Math.sin(p.y / 30) * 0.8 + p.speedX;
        p.rotation += p.rotationSpeed;

        if (p.y > height + 20) {
          p.y = -20;
          p.x = Math.random() * width;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;

        // Vẽ cánh hoa mềm mại
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-p.size / 2, -p.size / 2, -p.size, p.size / 3, 0, p.size);
        ctx.bezierCurveTo(p.size, p.size / 3, p.size / 2, -p.size / 2, 0, 0);
        ctx.fill();

        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Slide ảnh tự động chạy (coverflow), dừng khi hover/chạm vào
  useEffect(() => {
    if (sliderPaused) return;
    const interval = setInterval(() => {
      setSliderIndex((prev) => (prev + 1) % sliderPhotos.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [sliderPaused, sliderPhotos.length]);

  const goToSlide = (idx) => {
    setSliderIndex(((idx % sliderPhotos.length) + sliderPhotos.length) % sliderPhotos.length);
  };
  const nextSlide = () => goToSlide(sliderIndex + 1);
  const prevSlide = () => goToSlide(sliderIndex - 1);

  const handleSlideTouchStart = (e) => {
    setSliderPaused(true);
    touchStartXRef.current = e.touches[0].clientX;
  };
  const handleSlideTouchEnd = (e) => {
    if (touchStartXRef.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    if (deltaX > 40) prevSlide();
    else if (deltaX < -40) nextSlide();
    touchStartXRef.current = null;
    setSliderPaused(false);
  };

  // Điều hướng Lightbox bằng bàn phím: ← → để chuyển ảnh, Esc để đóng
  useEffect(() => {
    if (!lightboxOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      else if (e.key === 'ArrowLeft') {
        setCurrentPhotoIdx((prev) => (prev > 0 ? prev - 1 : sliderPhotos.length - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentPhotoIdx((prev) => (prev < sliderPhotos.length - 1 ? prev + 1 : 0));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightboxOpen, sliderPhotos.length]);

  // Tải danh sách ảnh cưới (lưu trên S3, URL lấy từ MongoDB qua BE)
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/photos`)
      .then((res) => res.json())
      .then((json) => {
        if (!json.success || !Array.isArray(json.data) || json.data.length === 0) return;
        const photos = json.data;

        const slider = photos
          .filter((p) => Array.isArray(p.tags) && p.tags.includes('slider'))
          .sort((a, b) => a.order - b.order);
        if (slider.length > 0) setSliderPhotos(slider);

        const hero = photos.find((p) => Array.isArray(p.tags) && p.tags.includes('hero'));
        if (hero) setHeroPhotoUrl(hero.url);

        const groom = photos.find((p) => Array.isArray(p.tags) && p.tags.includes('groom'));
        if (groom) setGroomPhotoUrl(groom.url);

        const bride = photos.find((p) => Array.isArray(p.tags) && p.tags.includes('bride'));
        if (bride) setBridePhotoUrl(bride.url);
      })
      .catch((err) => console.error('Lỗi tải ảnh:', err));
  }, []);

  // Kết nối Backend REST API và WebSocket Realtime (Cổng 8080)
  useEffect(() => {
    // 1. Tải danh sách lời chúc ban đầu từ MongoDB
    fetch(`${API_BASE_URL}/api/wishes`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setWishes(
            json.data.map((w) => ({
              id: w._id,
              name: w.name,
              side: w.side || 'Bạn bè',
              time: new Date(w.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
              message: w.message,
            }))
          );
        } else {
          // Dữ liệu mẫu nếu DB trống
          setWishes([
            {
              name: 'Nguyễn Văn Minh',
              side: 'Nhà Trai',
              time: 'Hôm nay',
              message: 'Chúc hai bạn An & Thủy trăm năm hạnh phúc, đầu bạc răng long, luôn tràn ngập tiếng cười!',
            },
            {
              name: 'Trần Thị Mai Phương',
              side: 'Nhà Gái',
              time: 'Hôm nay',
              message: 'Chúc cô dâu Bích Thủy luôn xinh đẹp rạng rỡ và hạnh phúc trọn vẹn bên chú rể Đức An nhé!',
            },
          ]);
        }
      })
      .catch((err) => {
        console.warn('Backend chưa sẵn sàng hoặc offline:', err.message);
      });

    // 2. Thiết lập kết nối Socket.io trực tiếp tới Backend HTTPS Cloudflare
    const socket = io(API_BASE_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      console.log('⚡ [Realtime] Đã kết nối WebSocket thành công');
      setSocketConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('🔌 [Realtime] Đã ngắt kết nối WebSocket');
      setSocketConnected(false);
    });

    socket.on('online_count', (count) => {
      setOnlineCount(count);
    });

    // Lắng nghe sự kiện lời chúc mới được gửi từ bất kỳ khách nào
    socket.on('new_wish', (newWish) => {
      console.log('🎉 [Realtime] Nhận được lời chúc mới:', newWish);
      const formattedWish = {
        id: newWish._id || Date.now(),
        name: newWish.name,
        side: newWish.side || 'Bạn bè',
        time: 'Vừa xong',
        message: newWish.message,
      };
      setWishes((prev) => [formattedWish, ...prev]);
      setJustAddedWishId(formattedWish.id);
      setTimeout(() => setJustAddedWishId(null), 2600);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Xử lý gửi lời chúc (Realtime qua Backend API / WebSocket)
  const handleAddWish = async (e) => {
    e.preventDefault();
    if (!newWishName.trim() || !newWishContent.trim() || isSubmittingWish) return;

    setIsSubmittingWish(true);
    const payload = {
      name: newWishName.trim(),
      side: newWishSide || 'Bạn bè',
      message: newWishContent.trim(),
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/wishes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setNewWishName('');
        setNewWishContent('');
      } else {
        alert(data.message || 'Không thể gửi lời chúc');
      }
    } catch (err) {
      console.error('Lỗi khi gửi lời chúc lên server:', err);
      // Fallback hiển thị cục bộ nếu server chưa bật
      setWishes((prev) => [
        {
          name: payload.name,
          side: payload.side,
          time: 'Vừa xong',
          message: payload.message,
        },
        ...prev,
      ]);
      setNewWishName('');
      setNewWishContent('');
    } finally {
      setIsSubmittingWish(false);
    }
  };

  // Xử lý RSVP (Gửi về Backend MongoDB)
  const handleRsvpSubmit = async (e) => {
    e.preventDefault();
    if (!rsvpName.trim() || isSubmittingRsvp) return;

    setIsSubmittingRsvp(true);
    const payload = {
      name: rsvpName.trim(),
      guestType: rsvpGuestType,
      attending: rsvpAttending,
      count: parseInt(rsvpCount) || 1,
      wishes: rsvpWishes.trim(),
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setRsvpSubmitted(true);
      } else {
        alert(data.message || 'Không thể gửi xác nhận');
      }
    } catch (err) {
      console.error('Lỗi gửi RSVP:', err);
      setRsvpSubmitted(true); // Fallback trải nghiệm người dùng
    } finally {
      setIsSubmittingRsvp(false);
    }
  };

  return (
    <>
      {/* ─── MÀN HÌNH THIỆP ĐÓNG (bấm để mở thiệp cưới) ─── */}
      {!inviteOpened && (
        <div className={`invite-cover${isOpeningInvite ? ' invite-cover-opening' : ''}`}>
          <div className="invite-cover-inner">
            <Heart size={18} className="invite-cover-deco invite-cover-deco-1 heart-beat" />
            <Heart size={14} className="invite-cover-deco invite-cover-deco-2 heart-beat" />

            <span className="font-royal invite-cover-label">TRÂN TRỌNG KÍNH MỜI</span>

            <div
              className={`envelope${isOpeningInvite ? ' is-opening' : ''}`}
              role="button"
              tabIndex={0}
              aria-label="Nhấn để mở thiệp cưới"
              onClick={handleOpenInvite}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') handleOpenInvite();
              }}
            >
              <div className="envelope-back">
                <div className="envelope-card">
                  <span className="font-script gold-text-gradient envelope-card-amp">&amp;</span>
                  <h2 className="font-serif envelope-card-names">
                    Đức An
                    <br />
                    Bích Thủy
                  </h2>
                </div>
              </div>
              <div className="envelope-flap" />
              <div className="envelope-seal">
                <Heart size={20} fill="#ffffff" color="#ffffff" />
              </div>
            </div>

            <p className="font-serif invite-cover-hint">✦ Nhấn vào thiệp để mở ✦</p>
          </div>
        </div>
      )}

      {/* Cánh hoa rơi toàn màn hình */}
      <canvas id="petals-canvas" />

      {/* Audio Element phát nhạc cưới chính thức của mẫu Lovely Date */}
      <audio ref={audioRef} src="/audio/wedding-music.mp3" loop preload="auto" />

      {/* Nút điều khiển nhạc nổi cố định ở góc phải */}
      <div style={{ position: 'fixed', bottom: '24px', right: '20px', zIndex: 100 }}>
        <button
          onClick={toggleMusic}
          aria-label="Bật/Tắt nhạc"
          style={{
            position: 'relative',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #1f1b18 0%, #3e3833 100%)',
            border: '2px solid #d4aa55',
            color: '#d4aa55',
            boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'transform 0.3s ease',
          }}
          className={`music-disk ${!isPlaying ? 'paused' : ''}`}
        >
          {isPlaying ? <Volume2 size={24} /> : <VolumeX size={24} />}
          {isPlaying && (
            <>
              <span className="floating-note" style={{ top: '-10px', left: '10px' }}>♪</span>
              <span className="floating-note" style={{ top: '-18px', left: '30px', animationDelay: '0.8s' }}>♫</span>
            </>
          )}
        </button>
      </div>

      {/* Khung thiệp cưới (M-Invite Phone Frame Style) */}
      <div className="invite-phone-wrapper">

        {/* ─── SECTION 1: HERO / COVER ─── */}
        <section
          style={{
            position: 'relative',
            padding: '50px 24px 40px',
            textAlign: 'center',
            background: 'linear-gradient(180deg, #ffffff 0%, #fcf9f4 100%)',
          }}
        >
          <div style={{ marginBottom: '16px' }}>
            <span
              className="font-script gold-text-gradient"
              style={{ fontSize: '38px', lineHeight: '1', display: 'block' }}
            >
              Save
            </span>
            <span
              className="font-royal"
              style={{
                fontSize: '15px',
                letterSpacing: '0.35em',
                fontWeight: '600',
                color: '#2a2522',
                display: 'block',
                marginTop: '4px',
              }}
            >
              THE DATE
            </span>
          </div>

          {/* Khung vòm Arch lớn chứa ảnh cưới đẹp nhất */}
          <div style={{ margin: '20px auto 26px', maxWidth: '380px' }}>
            <div
              className="arch-frame"
              style={{
                width: '100%',
                height: '470px',
                border: '4px solid #ffffff',
                boxShadow: '0 16px 40px rgba(184, 138, 50, 0.22)',
              }}
            >
              <img
                src="/photos/DSC_2011.jpg"
                alt="Vũ Đức An & Đinh Thị Bích Thủy"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center 20%',
                }}
              />
            </div>
          </div>

          {/* Ngày cưới lớn */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', margin: '20px 0 16px' }}>
            <div style={{ height: '1px', width: '45px', background: 'linear-gradient(90deg, transparent, #c59b48)' }} />
            <div style={{ textAlign: 'center' }}>
              <span className="font-royal" style={{ fontSize: '13px', letterSpacing: '0.2em', color: '#7a7065', display: 'block' }}>
                THÁNG 11
              </span>
              <span className="font-royal" style={{ fontSize: '46px', fontWeight: '700', color: '#231f20', lineHeight: '1.1' }}>
                29
              </span>
              <span className="font-royal" style={{ fontSize: '15px', letterSpacing: '0.25em', color: '#7a7065', display: 'block' }}>
                2026
              </span>
            </div>
            <div style={{ height: '1px', width: '45px', background: 'linear-gradient(90deg, #c59b48, transparent)' }} />
          </div>

          <p className="font-serif" style={{ fontSize: '13px', fontStyle: 'italic', color: '#9e721d', margin: '-6px 0 0' }}>
            (Nhằm ngày 21 tháng 10 Âm lịch)
          </p>

          {/* Tên Chú rể & Cô dâu */}
          <div style={{ margin: '14px 0 8px' }}>
            <h1
              className="font-serif"
              style={{
                fontSize: '26px',
                fontWeight: '600',
                letterSpacing: '0.04em',
                color: '#1a1816',
                textTransform: 'uppercase',
              }}
            >
              VŨ ĐỨC AN
            </h1>
            <span
              className="font-script gold-text-gradient"
              style={{ fontSize: '42px', lineHeight: '1', display: 'block', margin: '2px 0' }}
            >
              &amp;
            </span>
            <h1
              className="font-serif"
              style={{
                fontSize: '26px',
                fontWeight: '600',
                letterSpacing: '0.04em',
                color: '#1a1816',
                textTransform: 'uppercase',
              }}
            >
              ĐINH THỊ BÍCH THỦY
            </h1>
          </div>

          {/* Địa điểm cưới */}
          <div style={{ marginTop: '24px', padding: '16px 20px', borderRadius: '16px', background: '#faf5ed', border: '1px solid #ede3d1' }}>
            <span className="font-royal" style={{ fontSize: '14px', fontWeight: '700', letterSpacing: '0.15em', color: '#916b24', display: 'block' }}>
              NHÀ THỜ GIÁO XỨ PHÚ MỸ
            </span>
            <p className="font-serif" style={{ fontSize: '13px', fontStyle: 'italic', color: '#554f49', marginTop: '4px' }}>
              Thánh lễ hôn phối - Thứ Năm, ngày 26 tháng 11 năm 2026
            </p>
            <p style={{ fontSize: '13px', color: '#686058', marginTop: '6px', lineHeight: '1.5' }}>
              Giáo xứ Phú Mỹ, xã Phú Xuyên, thành phố Hà Nội
            </p>
          </div>
        </section>


        {/* ─── SECTION 2: WEDDING OF (GIỚI THIỆU CÔ DÂU & CHÚ RỂ) ─── */}
        <section style={{ padding: '45px 24px', textAlign: 'center', backgroundColor: '#ffffff' }}>
          <span className="font-royal" style={{ fontSize: '13px', letterSpacing: '0.3em', color: '#9e721d', textTransform: 'uppercase' }}>
            Wedding
          </span>
          <span className="font-script gold-text-gradient" style={{ fontSize: '50px', display: 'block', lineHeight: '1', margin: '2px 0 10px' }}>
            of
          </span>

          <p className="font-serif" style={{ fontSize: '14px', fontStyle: 'italic', color: '#5e5650', maxWidth: '380px', margin: '0 auto 35px', lineHeight: '1.8' }}>
            &ldquo;Hôm nay không chỉ là ngày chúng mình trở thành vợ chồng, mà còn là ngày bắt đầu một hành trình mới. Mong rằng những năm tháng sau này, chúng mình vẫn luôn chọn nhau, yêu thương nhau và cùng nhau đi thật lâu.&rdquo;
          </p>

          {/* Cặp đôi Chú rể & Cô dâu */}
          <div className="couple-container" style={{ margin: '30px auto' }}>
            {/* Chú rể */}
            <div style={{ flex: '1', maxWidth: '300px' }}>
              <div style={{ width: '220px', height: '280px', margin: '0 auto 16px' }}>
                <div className="arch-frame" style={{ width: '100%', height: '100%', border: '3px solid #ede3d1' }}>
                  <img
                    src="/photos/DSC_1220.jpg"
                    alt="Chú rể Vũ Đức An"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%' }}
                  />
                </div>
              </div>
              <span className="font-script gold-text-gradient" style={{ fontSize: '30px' }}>Chú rể</span>
              <h3 className="font-serif" style={{ fontSize: '20px', fontWeight: '700', letterSpacing: '0.05em', color: '#231f20' }}>
                VŨ ĐỨC AN
              </h3>
              <p style={{ fontSize: '13px', color: '#7a7065', fontStyle: 'italic', marginTop: '4px' }}>
                Chàng trai chân thành, ấm áp và luôn dành trọn sự yêu thương
              </p>
            </div>

            {/* Icon trái tim nối giữa hai người */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 0' }}>
              <Heart size={26} className="heart-beat" style={{ color: '#c59b48', fill: '#c59b48' }} />
              <span className="font-script gold-text-gradient" style={{ fontSize: '26px' }}>Forever</span>
            </div>

            {/* Cô dâu */}
            <div style={{ flex: '1', maxWidth: '300px' }}>
              <div style={{ width: '220px', height: '280px', margin: '0 auto 16px' }}>
                <div className="arch-frame" style={{ width: '100%', height: '100%', border: '3px solid #ede3d1' }}>
                  <img
                    src={groomPhotoUrl}
                    alt="Cô dâu Đinh Thị Bích Thủy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%' }}
                  />
                </div>
              </div>
              <span className="font-script gold-text-gradient" style={{ fontSize: '30px' }}>Cô dâu</span>
              <h3 className="font-serif" style={{ fontSize: '20px', fontWeight: '700', letterSpacing: '0.05em', color: '#231f20' }}>
                ĐINH THỊ BÍCH THỦY
              </h3>
              <p style={{ fontSize: '13px', color: '#7a7065', fontStyle: 'italic', marginTop: '4px' }}>
                Cô gái ngọt ngào, dịu dàng với nụ cười luôn tỏa nắng
              </p>
            </div>
          </div>

          <div style={{ marginTop: '30px', padding: '16px', background: '#faf6f0', borderRadius: '16px' }}>
            <p style={{ fontSize: '13px', color: '#686058', lineHeight: '1.7' }}>
              Cùng gia đình hai bên, chúng mình rất vui khi được mời bạn đến chung vui trong ngày đặc biệt này.
            </p>
          </div>
        </section>


        {/* ─── SECTION 3: COUNTDOWN TIMER (ĐẾM NGƯỢC NGÀY CƯỚI) ─── */}
        <section
          style={{
            padding: '45px 24px',
            textAlign: 'center',
            background: 'linear-gradient(135deg, #2b2520 0%, #171412 100%)',
            color: '#ffffff',
          }}
        >
          <span className="font-script gold-text-gradient" style={{ fontSize: '38px', lineHeight: '1' }}>
            Our
          </span>
          <h2 className="font-royal" style={{ fontSize: '18px', letterSpacing: '0.25em', color: '#f7e7c4', marginTop: '2px' }}>
            SPECIAL DAY
          </h2>
          <p style={{ fontSize: '13px', color: '#b8aba0', margin: '8px auto 26px', maxWidth: '340px', fontStyle: 'italic' }}>
            &ldquo;A lifetime of love begins here.&rdquo;
          </p>

          {/* Đồng hồ đếm ngược 4 ô */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', maxWidth: '380px', margin: '0 auto' }}>
            {[
              { label: 'NGÀY', val: countdown.days },
              { label: 'GIỜ', val: countdown.hours },
              { label: 'PHÚT', val: countdown.minutes },
              { label: 'GIÂY', val: countdown.seconds },
            ].map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(212, 170, 85, 0.35)',
                  borderRadius: '16px',
                  padding: '16px 6px',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <span className="font-royal" style={{ fontSize: '28px', fontWeight: '700', color: '#f5c97b', display: 'block', lineHeight: '1' }}>
                  {String(item.val).padStart(2, '0')}
                </span>
                <span style={{ fontSize: '10px', letterSpacing: '0.15em', color: '#d1c5b8', marginTop: '6px', display: 'block' }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </section>


        {/* ─── SECTION 4: SAVE THE DAY / CALENDAR ─── */}
        <section style={{ padding: '45px 24px', textAlign: 'center', backgroundColor: '#fcfaf6' }}>
          <span className="font-script gold-text-gradient" style={{ fontSize: '40px', lineHeight: '1' }}>
            Save
          </span>
          <h2 className="font-royal" style={{ fontSize: '18px', letterSpacing: '0.25em', color: '#2a2522', marginTop: '2px' }}>
            THE DAY
          </h2>
          <p style={{ fontSize: '13px', color: '#7a7065', fontStyle: 'italic', margin: '6px auto 24px', maxWidth: '340px' }}>
            &ldquo;Hãy lưu lại ngày đặc biệt và cùng chúng mình đón mừng khoảnh khắc trọng đại này nhé.&rdquo;
          </p>

          {/* Lịch tháng 11/2026 */}
          <div
            style={{
              maxWidth: '360px',
              margin: '0 auto',
              background: '#ffffff',
              borderRadius: '24px',
              padding: '24px 20px',
              border: '1px solid #ede3d1',
              boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <span className="font-serif" style={{ fontSize: '16px', fontWeight: '700', color: '#916b24', letterSpacing: '0.08em' }}>
                THÁNG 11 / 2026
              </span>
              <span style={{ fontSize: '12px', color: '#887d72' }}>Chủ Nhật</span>
            </div>

            {/* Các thứ trong tuần */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', marginBottom: '10px', fontSize: '11px', fontWeight: '600', color: '#a09588' }}>
              <span>T2</span>
              <span>T3</span>
              <span>T4</span>
              <span>T5</span>
              <span>T6</span>
              <span>T7</span>
              <span style={{ color: '#d9534f' }}>CN</span>
            </div>

            {/* Ngày trong tháng 11/2026 (Ngày 1 rơi vào Chủ Nhật) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', fontSize: '13px' }}>
              {/* Khoảng trống đầu tháng (6 ô trống) */}
              {[...Array(6)].map((_, i) => (
                <span key={'empty-' + i} />
              ))}

              {/* 30 ngày trong tháng 11 */}
              {[...Array(30)].map((_, i) => {
                const day = i + 1;
                const isWeddingDay = day === 29;

                return (
                  <div
                    key={day}
                    style={{
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      fontWeight: isWeddingDay ? '700' : '400',
                      color: isWeddingDay ? '#ffffff' : (i % 7 === 0 ? '#d9534f' : '#332e29'),
                      background: isWeddingDay ? 'linear-gradient(135deg, #d4aa55 0%, #b88a32 100%)' : 'transparent',
                      boxShadow: isWeddingDay ? '0 4px 12px rgba(184, 138, 50, 0.45)' : 'none',
                      position: 'relative',
                    }}
                  >
                    {day}
                    {isWeddingDay && (
                      <Heart
                        size={12}
                        className="heart-beat"
                        style={{
                          position: 'absolute',
                          top: '-6px',
                          right: '-4px',
                          fill: '#e74c3c',
                          color: '#e74c3c',
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>


        {/* ─── SECTION 5: ALBUM ẢNH CƯỚI (PHOTO GALLERY) ─── */}
        <section style={{ padding: '45px 20px', backgroundColor: '#ffffff', textAlign: 'center' }}>
          <span className="font-script gold-text-gradient" style={{ fontSize: '42px', lineHeight: '1' }}>
            yêu thương
          </span>
          <h2 className="font-royal" style={{ fontSize: '18px', letterSpacing: '0.25em', color: '#231f20', marginTop: '2px' }}>
            OUR LOVE STORY
          </h2>
          <p style={{ fontSize: '13px', color: '#7a7065', fontStyle: 'italic', margin: '6px auto 26px', maxWidth: '340px' }}>
            &ldquo;Our love story continues.&rdquo;
          </p>

          {/* Slide ảnh kiểu coverflow: ảnh giữa nổi bật, 2 bên hé lộ mờ dần */}
          <div
            className="photo-slider"
            onMouseEnter={() => setSliderPaused(true)}
            onMouseLeave={() => setSliderPaused(false)}
            onTouchStart={handleSlideTouchStart}
            onTouchEnd={handleSlideTouchEnd}
          >
            <div className="photo-slider-track">
              {sliderPhotos.map((photo, idx) => {
                const count = sliderPhotos.length;
                let d = idx - sliderIndex;
                if (d > count / 2) d -= count;
                if (d < -count / 2) d += count;
                const abs = Math.abs(d);
                const isCenter = d === 0;
                const scale = isCenter ? 1 : abs === 1 ? 0.76 : 0.6;
                const opacity = isCenter ? 1 : abs === 1 ? 0.55 : 0;
                const z = 10 - abs;

                return (
                  <div
                    key={idx}
                    className={`photo-slide${isCenter ? ' photo-slide-center' : ''}`}
                    onClick={() => {
                      if (isCenter) {
                        setCurrentPhotoIdx(idx);
                        setLightboxOpen(true);
                      } else {
                        goToSlide(idx);
                      }
                    }}
                    style={{
                      transform: `translate(-50%, -50%) translateX(${d * 88}%) rotateY(${(d * -24).toFixed(1)}deg) scale(${scale})`,
                      opacity,
                      zIndex: z,
                      pointerEvents: abs <= 1 ? 'auto' : 'none',
                    }}
                  >
                    <img src={photo.url} alt={`Ảnh cưới ${idx + 1}`} loading="lazy" />
                    {isCenter && (
                      <div className="photo-slide-hint">
                        <span>✦ Nhấn để xem toàn màn hình ✦</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              aria-label="Ảnh trước"
              onClick={prevSlide}
              className="photo-slider-nav photo-slider-nav-prev"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              type="button"
              aria-label="Ảnh tiếp theo"
              onClick={nextSlide}
              className="photo-slider-nav photo-slider-nav-next"
            >
              <ChevronRight size={22} />
            </button>
          </div>

          {/* Chấm điều hướng */}
          <div className="photo-slider-dots">
            {sliderPhotos.map((_, idx) => (
              <button
                key={idx}
                type="button"
                aria-label={`Xem ảnh ${idx + 1}`}
                onClick={() => goToSlide(idx)}
                className={`photo-slider-dot${idx === sliderIndex ? ' active' : ''}`}
              />
            ))}
          </div>
        </section>


        {/* ─── SECTION 6: SỰ KIỆN & LỊCH TRÌNH CƯỚI (TIMELINE) ─── */}
        <section style={{ padding: '45px 24px', backgroundColor: '#fcf9f5', textAlign: 'center' }}>
          <span className="font-script gold-text-gradient" style={{ fontSize: '40px', lineHeight: '1' }}>
            Wedding
          </span>
          <h2 className="font-royal" style={{ fontSize: '18px', letterSpacing: '0.25em', color: '#231f20', marginTop: '2px' }}>
            SỰ KIỆN CƯỚI
          </h2>
          <p style={{ fontSize: '13px', color: '#7a7065', margin: '6px auto 30px' }}>
            Thông tin chi tiết về các buổi lễ &amp; tiệc cưới
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            {/* 2 Lễ xếp 2 cột khi màn hình rộng */}
            <div className="two-col-grid">
              {/* Lễ Vu Quy */}
              <div className="bank-card" style={{ textAlign: 'left', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <Clock size={18} style={{ color: '#c59b48' }} />
                  <span className="font-serif" style={{ fontSize: '18px', fontWeight: '700', color: '#231f20' }}>
                    Lễ Vu Quy (Nhà Gái)
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: '#887d72', marginBottom: '10px' }}>
                  ⏰ 14:30 - Chủ Nhật, Ngày 29 Tháng 11 Năm 2026
                </p>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: '#554f49', marginBottom: '12px' }}>
                  <MapPin size={16} style={{ color: '#c59b48', flexShrink: 0, marginTop: '2px' }} />
                  <span>Tư gia nhà gái: Số nhà 83, thôn Yên Phú, xã Thường Tín, thành phố Hà Nội</span>
                </div>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent('Số nhà 83, thôn Yên Phú, xã Thường Tín, thành phố Hà Nội')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-outline-gold"
                  style={{ width: '100%', textDecoration: 'none' }}
                >
                  <MapPin size={15} /> Chỉ đường trên Google Maps
                </a>
              </div>

              {/* Lễ Thành Hôn */}
              <div className="bank-card" style={{ textAlign: 'left', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <Clock size={18} style={{ color: '#c59b48' }} />
                  <span className="font-serif" style={{ fontSize: '18px', fontWeight: '700', color: '#231f20' }}>
                    Lễ Thành Hôn (Nhà Trai)
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: '#887d72', marginBottom: '10px' }}>
                  ⏰ 15:00 - Chủ Nhật, Ngày 29 Tháng 11 Năm 2026
                </p>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: '#554f49', marginBottom: '12px' }}>
                  <MapPin size={16} style={{ color: '#c59b48', flexShrink: 0, marginTop: '2px' }} />
                  <span>Tư gia nhà trai: Nhà 93, thôn Phú Mỹ, xã Phú Xuyên, thành phố Hà Nội</span>
                </div>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent('Nhà 93, thôn Phú Mỹ, xã Phú Xuyên, thành phố Hà Nội')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-outline-gold"
                  style={{ width: '100%', textDecoration: 'none' }}
                >
                  <MapPin size={15} /> Chỉ đường trên Google Maps
                </a>
              </div>
            </div>
          </div>
        </section>


        {/* ─── SECTION 7: R.S.V.P (XÁC NHẬN THAM DỰ) ─── */}
        <section style={{ padding: '45px 24px', backgroundColor: '#ffffff', textAlign: 'center' }}>
          <h2 className="font-royal" style={{ fontSize: '20px', letterSpacing: '0.25em', color: '#231f20' }}>
            R.S.V.P
          </h2>
          <p style={{ fontSize: '13px', color: '#7a7065', fontStyle: 'italic', margin: '6px auto 28px', maxWidth: '340px' }}>
            &ldquo;Sự hiện diện của bạn là niềm vui của chúng mình. Hãy xác nhận tham dự nhé!&rdquo;
          </p>

          {rsvpSubmitted ? (
            <div
              style={{
                padding: '30px 20px',
                borderRadius: '20px',
                background: '#fcf8f0',
                border: '1px solid #ebdcc5',
              }}
            >
              <Heart size={42} className="heart-beat" style={{ color: '#c59b48', fill: '#c59b48', margin: '0 auto 14px' }} />
              <h3 className="font-serif" style={{ fontSize: '20px', color: '#916b24', marginBottom: '8px' }}>
                Cảm ơn bạn rất nhiều!
              </h3>
              <p style={{ fontSize: '13px', color: '#686058' }}>
                Đức An &amp; Bích Thủy đã nhận được phản hồi của bạn và rất mong chờ được đón tiếp bạn trong ngày vui! 💕
              </p>
            </div>
          ) : (
            <form onSubmit={handleRsvpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left', maxWidth: '560px', margin: '0 auto' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#554f49', display: 'block', marginBottom: '6px' }}>
                  Họ và tên của bạn *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nhập họ và tên..."
                  value={rsvpName}
                  onChange={(e) => setRsvpName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '1px solid #dfd5c5',
                    fontSize: '14px',
                    outline: 'none',
                    backgroundColor: '#faf8f5',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#554f49', display: 'block', marginBottom: '6px' }}>
                  Bạn là khách mời của:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setRsvpGuestType('groom')}
                    style={{
                      padding: '10px',
                      borderRadius: '10px',
                      border: rsvpGuestType === 'groom' ? '1.5px solid #c59b48' : '1px solid #ebdcc5',
                      background: rsvpGuestType === 'groom' ? '#faf3e6' : '#ffffff',
                      color: rsvpGuestType === 'groom' ? '#916b24' : '#686058',
                      fontWeight: '600',
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    Nhà Trai (Đức An)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRsvpGuestType('bride')}
                    style={{
                      padding: '10px',
                      borderRadius: '10px',
                      border: rsvpGuestType === 'bride' ? '1.5px solid #c59b48' : '1px solid #ebdcc5',
                      background: rsvpGuestType === 'bride' ? '#faf3e6' : '#ffffff',
                      color: rsvpGuestType === 'bride' ? '#916b24' : '#686058',
                      fontWeight: '600',
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    Nhà Gái (Bích Thủy)
                  </button>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#554f49', display: 'block', marginBottom: '6px' }}>
                  Bạn sẽ tham dự chứ?
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: rsvpAttending === 'yes' ? '#faf3e6' : '#fcfaf6',
                      border: rsvpAttending === 'yes' ? '1px solid #c59b48' : '1px solid #eee',
                      cursor: 'pointer',
                      fontSize: '13px',
                    }}
                  >
                    <input
                      type="radio"
                      name="attending"
                      value="yes"
                      checked={rsvpAttending === 'yes'}
                      onChange={() => setRsvpAttending('yes')}
                    />
                    <span>Có, tôi chắc chắn sẽ tham dự 🎉</span>
                  </label>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: rsvpAttending === 'no' ? '#faf3e6' : '#fcfaf6',
                      border: rsvpAttending === 'no' ? '1px solid #c59b48' : '1px solid #eee',
                      cursor: 'pointer',
                      fontSize: '13px',
                    }}
                  >
                    <input
                      type="radio"
                      name="attending"
                      value="no"
                      checked={rsvpAttending === 'no'}
                      onChange={() => setRsvpAttending('no')}
                    />
                    <span>Tôi bận, rất tiếc không thể tham dự 💌</span>
                  </label>
                </div>
              </div>

              {rsvpAttending === 'yes' && (
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#554f49', display: 'block', marginBottom: '6px' }}>
                    Số lượng người tham dự:
                  </label>
                  <select
                    value={rsvpCount}
                    onChange={(e) => setRsvpCount(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #dfd5c5',
                      fontSize: '14px',
                      backgroundColor: '#faf8f5',
                    }}
                  >
                    <option value="1">1 người</option>
                    <option value="2">2 người</option>
                    <option value="3">3 người</option>
                    <option value="4+">Nhiều hơn 3 người</option>
                  </select>
                </div>
              )}

              <button type="submit" className="btn-gold" style={{ width: '100%', marginTop: '10px' }}>
                <Send size={16} /> Gửi xác nhận tham dự
              </button>
            </form>
          )}
        </section>


        {/* ─── SECTION 8: SỔ LƯU BÚT (GUESTBOOK / LỜI CHÚC) ─── */}
        <section style={{ padding: '45px 24px', backgroundColor: '#ffffff', textAlign: 'center' }}>
          <span className="font-script gold-text-gradient" style={{ fontSize: '38px', lineHeight: '1' }}>
            Gửi gắm
          </span>
          <h2 className="font-royal" style={{ fontSize: '18px', letterSpacing: '0.25em', color: '#231f20', marginTop: '2px' }}>
            LỜI CHÚC PHÚC
          </h2>
          <p style={{ fontSize: '13px', color: '#7a7065', fontStyle: 'italic', margin: '6px auto 14px', maxWidth: '340px' }}>
            Hãy gửi những lời chúc tốt đẹp nhất đến cặp đôi mới cưới!
          </p>

          {/* Badge Realtime Online */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f5f3ee', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', color: '#554f49', marginBottom: '22px' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: socketConnected ? '#22c55e' : '#eab308' }} />
            <span>{socketConnected ? `Realtime: ${onlineCount} khách đang online` : 'Đang kết nối Realtime...'}</span>
          </div>

          <form onSubmit={handleAddWish} style={{ textAlign: 'left', marginBottom: '30px', maxWidth: '560px', margin: '0 auto 30px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: '10px', marginBottom: '12px' }}>
              <input
                type="text"
                required
                placeholder="Tên của bạn..."
                value={newWishName}
                onChange={(e) => setNewWishName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: '1px solid #ded3c1',
                  fontSize: '14px',
                  outline: 'none',
                  backgroundColor: '#faf8f5',
                }}
              />
              <select
                value={newWishSide}
                onChange={(e) => setNewWishSide(e.target.value)}
                style={{
                  padding: '12px 10px',
                  borderRadius: '12px',
                  border: '1px solid #ded3c1',
                  fontSize: '13px',
                  outline: 'none',
                  backgroundColor: '#faf8f5',
                  color: '#444',
                }}
              >
                <option value="Bạn bè">Bạn bè</option>
                <option value="Nhà Trai">Nhà Trai</option>
                <option value="Nhà Gái">Nhà Gái</option>
              </select>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <textarea
                required
                rows={3}
                placeholder="Nhập lời chúc chân thành của bạn..."
                value={newWishContent}
                onChange={(e) => setNewWishContent(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: '1px solid #ded3c1',
                  fontSize: '14px',
                  outline: 'none',
                  backgroundColor: '#faf8f5',
                  resize: 'none',
                }}
              />
            </div>
            <button
              type="submit"
              disabled={isSubmittingWish}
              className="btn-gold"
              style={{ width: '100%', opacity: isSubmittingWish ? 0.7 : 1 }}
            >
              <Heart size={16} /> {isSubmittingWish ? 'Đang gửi...' : 'Gửi lời chúc mừng'}
            </button>
          </form>

          {/* Danh sách lời chúc - chạy liên tục dạng băng chuyền, dừng khi tương tác */}
          <div
            className="wish-ticker-viewport"
            onMouseEnter={() => setWishTickerPaused(true)}
            onMouseLeave={() => setWishTickerPaused(false)}
            onTouchStart={() => setWishTickerPaused(true)}
            onTouchEnd={() => setWishTickerPaused(false)}
          >
            <div
              className="wish-ticker-track"
              style={{
                animationDuration: `${Math.max(wishes.length * 4, 10)}s`,
                animationPlayState: wishTickerPaused ? 'paused' : 'running',
              }}
            >
              {(wishes.length > 0 ? [...wishes, ...wishes] : []).map((w, idx) => (
                <div
                  key={`${w.id || idx}-${idx < wishes.length ? 'a' : 'b'}`}
                  className={`wish-card${w.id && w.id === justAddedWishId ? ' wish-card-new' : ''}`}
                  style={{
                    textAlign: 'left',
                    padding: '16px',
                    borderRadius: '16px',
                    background: '#faf6f0',
                    border: '1px solid #ece2d2',
                    animationDelay: `${Math.min(idx, 8) * 0.06}s`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: '700', fontSize: '14px', color: '#231f20' }}>
                        {w.name}
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          backgroundColor:
                            w.side === 'Nhà Trai'
                              ? '#e8f0fe'
                              : w.side === 'Nhà Gái'
                              ? '#fce8e6'
                              : '#fef7e0',
                          color:
                            w.side === 'Nhà Trai'
                              ? '#1a73e8'
                              : w.side === 'Nhà Gái'
                              ? '#d93025'
                              : '#b06000',
                          fontWeight: '600',
                        }}
                      >
                        {w.side}
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: '#a09486' }}>
                      {w.time}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#554f49', lineHeight: '1.6' }}>
                    {w.message}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <p style={{ fontSize: '11px', color: '#a09486', marginTop: '10px' }}>
            ✦ Di chuột hoặc chạm vào để dừng xem lời chúc ✦
          </p>
        </section>


        {/* ─── SECTION 10: LỜI CẢM ƠN & FOOTER ─── */}
        <footer
          style={{
            padding: '50px 24px 70px',
            textAlign: 'center',
            background: 'linear-gradient(180deg, #fcf9f5 0%, #ede4d5 100%)',
          }}
        >
          <span className="font-script gold-text-gradient" style={{ fontSize: '48px', lineHeight: '1' }}>
            Thank you!
          </span>
          <h3 className="font-serif" style={{ fontSize: '20px', fontWeight: '700', letterSpacing: '0.06em', color: '#2a2522', marginTop: '6px' }}>
            VŨ ĐỨC AN &amp; ĐINH THỊ BÍCH THỦY
          </h3>
          <p style={{ fontSize: '13px', color: '#686058', fontStyle: 'italic', maxWidth: '340px', margin: '10px auto 20px', lineHeight: '1.7' }}>
            &ldquo;Cảm ơn tất cả mọi người đã luôn đồng hành, yêu thương và sẻ chia niềm hạnh phúc to lớn này cùng chúng mình.&rdquo;
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#916b24', fontSize: '12px' }}>
            <Heart size={14} className="heart-beat" style={{ fill: '#c59b48' }} />
            <span>Forever Love · 29.11.2026</span>
          </div>
        </footer>

      </div>


      {/* ─── LIGHTBOX XEM ẢNH CƯỚI TOÀN MÀN HÌNH ─── */}
      {lightboxOpen && (
        <div className="lightbox-backdrop" onClick={() => setLightboxOpen(false)}>
          <button
            onClick={() => setLightboxOpen(false)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: '#ffffff',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
            }}
          >
            <X size={24} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setCurrentPhotoIdx((prev) => (prev > 0 ? prev - 1 : sliderPhotos.length - 1));
            }}
            style={{
              position: 'absolute',
              left: '16px',
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: '#ffffff',
              borderRadius: '50%',
              width: '48px',
              height: '48px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
            }}
          >
            <ChevronLeft size={28} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setCurrentPhotoIdx((prev) => (prev < sliderPhotos.length - 1 ? prev + 1 : 0));
            }}
            style={{
              position: 'absolute',
              right: '16px',
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: '#ffffff',
              borderRadius: '50%',
              width: '48px',
              height: '48px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
            }}
          >
            <ChevronRight size={28} />
          </button>

          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '90vw',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <img
              key={currentPhotoIdx}
              src={sliderPhotos[currentPhotoIdx]?.url}
              alt="Ảnh cưới phóng to"
              className="lightbox-image"
              style={{
                maxWidth: '100%',
                maxHeight: '80vh',
                objectFit: 'contain',
                borderRadius: '12px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
              }}
            />
            <span style={{ color: '#ffffff', fontSize: '13px', marginTop: '12px', letterSpacing: '0.1em' }}>
              {currentPhotoIdx + 1} / {sliderPhotos.length}
            </span>
          </div>
        </div>
      )}
    </>
  );
}
