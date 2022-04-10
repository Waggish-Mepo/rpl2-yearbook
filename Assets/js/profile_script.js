$(document).ready(function(){

    let html = '';
    let options = { year: 'numeric', month: 'long', day: 'numeric' };
    
    profiles.sort((a, b) => (a.no > b.no) ? 1 : -1);

    profiles.forEach((profile) => {
        let dateOfBirth = new Date(profile.date_of_birth).toLocaleDateString('id-ID', options);

        html += `
        <div class="slider-card">
            <div class="card-wrap p-4">
                <img class="card-img" src="${profile.picture}" loading="lazy">
                <p class="text-justify py-2">
                    <b>Nama:</b> ${profile.name}
                    <br>
                    <b>Panggilan:</b> ${profile.nickname}
                    <br>
                    <b>Tempat, Tanggal Lahir:</b> ${profile.place_of_birth}, ${dateOfBirth}
                    <br>
                    <b>Instagram:</b> ${profile.instagram}
                    <br>
                    <b>Hobi:</b> ${profile.hobby}
                    <br>
                    <b>Quotes:</b> ${profile.quote}
                    <br>
                    <b>Pesan:</b> ${profile.message}
                </p>
            </div>
        </div>
    `;
    })

    $('#profile-slider').html(html);
    $(".owl-carousel").owlCarousel({
        loop:true,
        margin:10,
        nav:true,
        autoplay:true,
        autoplayTimeout:6000,
        autoplayHoverPause:true,
        center: true,
        navText: [
            "<i class='fa fa-angle-left'></i>",
            "<i class='fa fa-angle-right'></i>"
        ],
        responsive:{
            0:{
                items:1
            },
            600:{
                items:1
            },
            1000:{
                items:2
            }
        }
    });
});