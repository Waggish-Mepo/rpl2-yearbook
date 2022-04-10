/*
HOW TO SHOW IMAGE FROM GOOGLE DRIVE

first, get your link
https://drive.google.com/file/d/13O21HX86wUmbr8rs51RUwf3-af-XSOGB/view?usp=sharing

then you'll get the ID of the file: 13O21HX86wUmbr8rs51RUwf3-af-XSOGB

now paste it to this link
https://drive.google.com/uc?export=view&id={id}

then you'll get this link for the image source, paste it in picture property on profiles object
https://drive.google.com/uc?export=view&id=13O21HX86wUmbr8rs51RUwf3-af-XSOGB

*/



const profiles =  [
    {
        nis : "11907601",
        name : "Yoga Pratama",
        nickname : "Agoy",
        date_of_birth : "9/11/2004",
        place_of_birth : "Bogor",
        hobby : "Nongkrong",
        quote : "Be better or be nothing arrow",
        message : "Manusia boleh berencana, tapi akhirnya saldo juga yang menentukan.",
        instagram : "@yogapratama11_",
        picture : "picture.yntkts"
    },
    {
        nis : "11907455",
        name : "Rafi Fadhila Ramadhani ",
        nickname : "Bro",
        date_of_birth : "11/12/2003",
        place_of_birth : "Bogor",
        hobby : "Oprekan alat, ngewibu",
        quote : "Udah jalanin aja",
        message : "Semoga sehat selalu untuk semuanya",
        instagram : "@rfkw12, @rafifadhila440",
        picture : "picture.yntkts"
    },
    {
        nis : "11907323",
        name : "Muhamad Rendi Syahril Saputra",
        nickname : "Rendi",
        date_of_birth : "10/4/2003",
        place_of_birth : "Bogor",
        hobby : "Melawan penjajah",
        quote : "Tak perlu kata kata jika tidak diperlukan",
        message : "Panjang umur sehat selalu",
        instagram : "@rendisyhrl",
        picture : "picture.yntkts"
    },
    {
        nis : "11907084",
        name : "David Satya Wibisono",
        nickname : "David",
        date_of_birth : "6/1/2003",
        place_of_birth : "Temanggung",
        hobby : "Ngoding sambil kayang",
        quote : "tetaplah tersenyum walau mirip joker",
        message : "Ke mana pun kita pergi dan apa pun yang kita lakukan, hati dan kesuksesan akan selalu bersama kita",
        instagram : "@davdstya_",
        picture : "picture.yntkts"
    },
    {
        nis : "11907154",
        name : "Fema Flamelina Putri",
        nickname : "Fema (make p juga bole la bole)",
        date_of_birth : "6/22/2004",
        place_of_birth : "Bogor",
        hobby : "Jadi Penonton",
        quote : "Tetap bangga menjadi pendek seperti kapten levi, cmiwiw.",
        message : "Bismillah dapet levi.",
        instagram : "@flmpt",
        picture : "picture.yntkts"
    },
    {
        nis : "11907096",
        name : "Devita Hasnasya Rahma",
        nickname : "devita",
        date_of_birth : "12/7/2004",
        place_of_birth : "Pekalongan",
        hobby : "nonton live tante lala",
        quote : "jika orang lain bisa maka aku belum tentu 😭🙏",
        message : "Dua tiga ikan pari \r\n Kasian crushnya gabisa dimiliki",
        instagram : "@dvt.hr",
        picture : "picture.yntkts"
    },
    {
        nis : "11907434",
        name : "Nurul Aviah",
        nickname : "av",
        date_of_birth : "12/21/2003",
        place_of_birth : "Bogor",
        hobby : "Memandangi wajah mu",
        quote : "Tetaplah berlari seperti di kejar anjing",
        message : "Mau pesen tapi takut ga di anter",
        instagram : "@nurullaviah",
        picture : "picture.yntkts"
    },
    {
        nis : "11907545",
        name : "Siti Nur Alawiyah",
        nickname : "Alaw",
        date_of_birth : "5/13/2004",
        place_of_birth : "Bogor",
        hobby : "Yang pasti bukan ngoding",
        quote : "Tidak ada wanita yg sabar, kecuali wanita indosiar",
        message : "Ucapan selamat emang menyenangkan, tapi tidak dengan ucapan \"selamat mengerjakan\"",
        instagram : "@snalwyhh",
        picture : "picture.yntkts"
    },
    {
        nis : "11907474",
        name : "Reski Junaidi Shalat",
        nickname : "-",
        date_of_birth : "6/1/2003",
        place_of_birth : "Bogor",
        hobby : "Ngemusik 24/7",
        quote : "Never try never know",
        message : "Semoga tanggal di kalendernya merah terus",
        instagram : "@reski.js",
        picture : "picture.yntkts"
    },
    {
        nis : "11907305",
        name : "Muhamad Geovalza Valeriandi",
        nickname : "Ge-yo",
        date_of_birth : "4/25/2004",
        place_of_birth : "Depok",
        hobby : "Main musik",
        quote : "\"No Surprises\"",
        message : "Hati hati di jalan",
        instagram : "@geovalza",
        picture : "picture.yntkts"
    },
    {
        nis : "11907239",
        name : "Muhamad Fadhil Mauladhani",
        nickname : "Kadang bapak sejarah, kadang bapak dosen tapi paling parah bapak pki sama bapak naji",
        date_of_birth : "5/16/2004",
        place_of_birth : "Bogor",
        hobby : "Memikirkan tujuan eksistensi manusia di dunia ini",
        quote : "Per aspera ad astra, aquila non captat muscas",
        message : "Can i stay here for a while with all these good people? i don't wanna grow up.",
        instagram : "@altf4m8",
        picture : "picture.yntkts"
    },
    {
        nis : "11907287",
        name : "Mochammad Nabil Hakm",
        nickname : "Nabil",
        date_of_birth : "3/30/2004",
        place_of_birth : "Sukabumi",
        hobby : "Turu",
        quote : "Turu",
        message : "Turu",
        instagram : "@Hkmnabil",
        picture : "picture.yntkts"
    },
    {
        nis : "11907406",
        name : "Nalisa Vianti",
        nickname : "dipanggil woy jg nengok",
        date_of_birth : "10/7/2003",
        place_of_birth : "Jakarta",
        hobby : "makan makan nonton",
        quote : "selagi dia bisa knp hrs gua",
        message : "tetaplah menyerah jngn smngt fwen",
        instagram : "@nalisavv",
        picture : "picture.yntkts"
    },
    {
        nis : "11907021",
        name : "Amanda Agustin",
        nickname : "Manda",
        date_of_birth : "8/26/2003",
        place_of_birth : "Bogor",
        hobby : "Gambar",
        quote : "au ahhh puyeng",
        message : "semangat bestihhhh🔥🔥🔥",
        instagram : "@amndair_",
        picture : "picture.yntkts"
    },
    {
        nis : "11907335",
        name : "Muhammad Abdurrasyid ",
        nickname : "Rasyid",
        date_of_birth : "11/24/2003",
        place_of_birth : "Bogor",
        hobby : "Bersantai",
        quote : "Jika anda tidak menyukai sesuatu ubahlah, jika anda tidak bisa mengubahnya maka ubah sudut pandang anda",
        message : "Jangan lupa rehat",
        instagram : "@m.abdurrasyid24",
        picture : "picture.yntkts"
    },
    {
        nis : "11806920",
        name : "Suryo Slamet Mujahid Musyaffa",
        nickname : "Suryo",
        date_of_birth : "11/22/2003",
        place_of_birth : "Jakarta",
        hobby : "Gaming",
        quote : "Life isn't that simple you fudge nuggets",
        message : "Jangan update Windows",
        instagram : "@suryomujahid",
        picture : "picture.yntkts"
    },
    {
        nis : "11907436",
        name : "Nurul Silpia ",
        nickname : "Silpia",
        date_of_birth : "7/31/2004",
        place_of_birth : "Kasur ",
        hobby : "Demus",
        quote : "Semua manusia sama di mata ikan",
        message : "Kalau nanti  zombie menyerbu kamu bakal aman, karena yang mereka incar adalah otak. Maaf ya, saya kalau lagi sendirian jarang ngobrol. Hehe :>",
        instagram : "@silpia_nuruls",
        picture : "picture.yntkts"
    },
    {
        nis : "11907055",
        name : "Asya Meira Maharani Putri",
        nickname : "Sya Asya Syaruunn",
        date_of_birth : "5/11/2004",
        place_of_birth : "Bogor",
        hobby : "Yang pasti bukan ngoding",
        quote : "Hidup adalah seni menggambar tanpa penghapus.",
        message : "Jangan hidup kyk Newton, kebanyakan gaya. Hehehehe . Semngt cari cuan bestie.",
        instagram : "@syamhrni_",
        picture : "picture.yntkts"
    },
    {
        nis : "11907029",
        name : "Andika Apriana",
        nickname : "Dik",
        date_of_birth : "4/19/2002",
        place_of_birth : "Bogor",
        hobby : "Ngegame",
        quote : "Tetap menyerah jangan semangat!",
        message : "Sehat sehat selalu ya!",
        instagram : "@andikaapriana_",
        picture : "picture.yntkts"
    },
    {
        nis : "07",
        name : "Muhamad Agung Laksana Putra",
        nickname : "jhon",
        date_of_birth : "12/18/0170",
        place_of_birth : "bengkel ahass",
        hobby : "mencari janda perawan",
        quote : "Bila hidup mu sulit, dan ingin normal, maka ganti lah kesulitan itu di pengaturan.",
        message : "\"Jika anda sudah memiliki pasangan, tolonglah jangan membina hubungan dengan orang lain, dan cobalah untuk setia dan menahan diri. \r\n Walaupun rumput tetangga lebih hijau, percayalah, walaupun rumput pasangan anda tidak hijau, setidaknya, masih lebat...\"",
        instagram : "@agunglksnptra_",
        picture : "picture.yntkts"
    },
    {
        nis : "11907257",
        name : "Muhammad Zain Quroisy",
        nickname : "Zein",
        date_of_birth : "4/16/2004",
        place_of_birth : "Bogor",
        hobby : "Ngedeketin cewe, tapi gagal wae(tapi boong sih)🤓aing memang gini😁",
        quote : "Make it work, make it right, make it fast, for everyone, everything and girls😀",
        message : "Untuk chiko dan merlyn kucing ku tercinta jangan lupa untuk belajar silat",
        instagram : "@zainquraisy1644",
        picture : "picture.yntkts"
    },
    {
        nis : "11907092",
        name : "Desy Fajriani",
        nickname : "Desy kalau gak soya awoakaoak",
        date_of_birth : "12/30/2004",
        place_of_birth : "Bogor",
        hobby : "Cari cuan 👍",
        quote : "Aku bukan pemalas. Aku sedang menjalankan mode hemat energi.",
        message : "Kapan bikin SIM cape jalan ke wikrama 😢",
        instagram : "@soyaaaaa_04",
        picture : "picture.yntkts"
    },
    {
        nis : "11907266",
        name : "Maulana Ardiansyah ",
        nickname : "Bading",
        date_of_birth : "10/18/2003",
        place_of_birth : "Bogor ",
        hobby : "Bebas",
        quote : "Jika kau lapar, maka makanlah",
        message : "Jawabannya ada di hati lanjut part 2",
        instagram : "@maulanaardi18_",
        picture : "picture.yntkts"
    },
    {
        nis : "15151515",
        name : "Muhamad Dandi Nurrizky",
        nickname : "Danzzz",
        date_of_birth : "8/17/1945",
        place_of_birth : "Nusantara",
        hobby : "Turu",
        quote : "Seberat apapun pekerjaan akan terasa ringan jika tidak dikerjakan.",
        message : "Terimakasih telah berjuang untuk spp + jajan + semesteran.",
        instagram : "@dandinurrizky",
        picture : "picture.yntkts"
    },
    {
        nis : "176385337(2910)",
        name : "Hussein Ismail",
        nickname : "ɴᴇᴋᴏᴍᴀ",
        date_of_birth : "7/3/2004",
        place_of_birth : "Bogor",
        hobby : "membantai public",
        quote : "Mandi hanya untuk orang bau",
        message : "Tobat Kok Diplanning?!",
        instagram : "@husengaol",
        picture : "picture.yntkts"
    },
    {
        nis : "23",
        name : "Muhammad Shiddiq Priyono",
        nickname : "Zaw Phyo Aung ",
        date_of_birth : "2/22/2004",
        place_of_birth : "Bogor",
        hobby : "Mobile Legends, Basket, Ngopi, Yang Paling Penting Turu Dek",
        quote : "Bùtóng de rén yǒu bùtóng de chénggōng",
        message : "\"For my mother, thank you for giving me everything \r \n 16,Waiting me\"",
        instagram : "@shiddiqpryn",
        picture : "picture.yntkts"
    },
    {
        nis : "11907248",
        name : "Muhammad Rakean Jati Permana Kusumah Hidayat",
        nickname : "mamatmanja",
        date_of_birth : "7/14/2004",
        place_of_birth : "Jakarta",
        hobby : "Melukis dan Belajar Hal baru",
        quote : "\"Saya siap belajar PTMT dan TIDAK mengikuti demo Senin 11 April 2022 \"",
        message : "Banyak memori selama 3 tahun perjuangan dan juga ada impian besar yang menanti dimasa depan, semoga kelak kami bisa berkontribusi ke almamater kami, banyak talent diluar sana, tapi kami yang dipilih untuk berada disini berkesempatan mendapat ilmu terbaik (di Wikrama Bogor) Terimakasih untuk para pengajar semua, Salam, Semoga silaturahmi tetap terjaga, om swastiastu namo buddhaya salam kebajikan Walaikumsalam",
        instagram : "@m.rakean",
        picture : "picture.yntkts"
    },
    {
        nis : "11907281",
        name : "Muhammad Haikal",
        nickname : "Kale",
        date_of_birth : "6/9/2004",
        place_of_birth : "Bogor",
        hobby : "Membaca dan Bernyanyi",
        quote : "Bermimpilah sesuka hati, sebab itu hanyalah mimpi.",
        message : "Tetap semangat, sukses selalu dan semoga selalu dilancarkan segala aktivitasnya.",
        instagram : "@muhhaykale",
        picture : "picture.yntkts"
    },
    {
        nis : "-",
        name : "Aditya Pramuji",
        nickname : "Menyeng",
        date_of_birth : "5/1/2003",
        place_of_birth : "Bumi",
        hobby : "Ngahuleng Tarik",
        quote : "\"Fakta yang menyakitkan akan lebih baik dibandingkan fiksi yang menyenangkan\"",
        message : "Salam dari Binjai",
        instagram : "11906984",
        picture : "picture.yntkts"
    },
    
    // {
    //     nis : "",
    //     name : "",
    //     nickname : "",
    //     date_of_birth : "",
    //     place_of_birth : "",
    //     hobby : "",
    //     quote : "",
    //     message : "",
    //     instagram : "",
    //     picture : "picture.yntkts"
    // },
    //input per 21:35:44 10 april 2022
]
