import type { DB, Hall, Movie, Showtime } from "../lib/store";

const id = () => crypto.randomUUID();

export function createSeedState(): Omit<DB, "users"> {
  const now = new Date();
  const cinemas = [
    { id: "c1", name: "سینما آزادی", city: "تهران", address: "خیابان ولیعصر" },
    { id: "c2", name: "سینما پردیس کوروش", city: "تهران", address: "مجتمع کوروش" },
    { id: "c3", name: "سینما بهمن", city: "کابل", address: "شهر نو" },
  ];
  const halls: Hall[] = [
    { id: "h1", cinemaId: "c1", name: "سالن ۱", rows: 6, seatsPerRow: 10 },
    { id: "h2", cinemaId: "c1", name: "سالن ۲", rows: 5, seatsPerRow: 8 },
    { id: "h3", cinemaId: "c2", name: "سالن VIP", rows: 4, seatsPerRow: 8 },
    { id: "h4", cinemaId: "c3", name: "سالن مرکزی", rows: 6, seatsPerRow: 10 },
  ];
  const movieData = [
    ["m1", "دنیای موازی", "علمی-تخیلی", 128, "+۱۳", "داستان جوانی که در جهانی موازی به دنبال گمشده‌ی خویش می‌گردد.", "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=600"],
    ["m2", "شب طولانی", "درام", 105, "+۱۵", "روایتی از یک شب سرنوشت‌ساز در دل شهر.", "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600"],
    ["m3", "نبرد آخر", "اکشن", 142, "+۱۵", "قهرمانی که برای نجات خانواده‌اش وارد نبرد نهایی می‌شود.", "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=600"],
    ["m4", "خاطرات پاییز", "عاشقانه", 98, "همه سنین", "داستانی احساسی از دو دلداده در پاییز شهر.", "https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=600"],
    ["m5", "کارآگاه شب", "معمایی", 115, "+۱۳", "پرونده‌ای مرموز که کارآگاه را به مرزهای واقعیت می‌کشاند.", "https://images.unsplash.com/photo-1518929458119-e5bf444c30f4?w=600"],
    ["m6", "کودکان آسمان", "خانوادگی", 92, "همه سنین", "زندگی روزمره‌ی کودکانی که رویاهای بزرگ در سر دارند.", "https://images.unsplash.com/photo-1596727147705-61a532a659bd?w=600"],
  ] as const;
  const movies: Movie[] = movieData.map(([movieId, title, genre, duration, rating, description, posterUrl]) => ({
    id: movieId, title, genre, duration, rating, description, posterUrl, published: true, createdAt: now.toISOString(),
  }));
  const times = ["14:00", "17:00", "20:30"];
  const showtimes: Showtime[] = [];
  for (let day = 0; day < 5; day++) {
    movies.forEach((movie, index) => {
      const hall = halls[(index + day) % halls.length];
      const [hour, minute] = times[day % times.length].split(":").map(Number);
      const startsAt = new Date(now);
      startsAt.setDate(startsAt.getDate() + day);
      startsAt.setHours(hour, minute, 0, 0);
      showtimes.push({ id: id(), movieId: movie.id, hallId: hall.id, cinemaId: hall.cinemaId, startsAt: startsAt.toISOString(), price: 120000 + day * 10000 });
    });
  }
  return { cinemas, halls, movies, showtimes, locks: [], reservations: [], tickets: [], payments: [] };
}
