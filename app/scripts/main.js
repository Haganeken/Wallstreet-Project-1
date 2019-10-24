// Constants
let ADD_CARD_SELECTOR = "#add-card-form";
let LOGIN_SELECTOR = "#login-form";
let REGISTER_SELECTOR = "#register-form";
let CARD_SELECTOR = "[data-card]";
let MODAL_SELECTOR = "[data-modal]";
let USER_SERVER_URL = "http://localhost:2403/users";
let CARD_SERVER_URL = "http://localhost:2403/cards";
let REGISTER_MODAL_SELECTOR = "#register-modal";
let LOGIN_MODAL_SELECTOR = "#login-modal";
let LOGIN_NAV_CONTAINER_SELECTOR = "#login-nav-container";
let SIGNOUT_NAV_CONTAINER_SELECTOR = '#signout-nav-container';
let MAP_SELECTOR = "#map";
let LOCATION_INPUT_SELECTOR = '#location';
let UPLOADED_IMAGE_SELECTOR = '#uploadedImage';


// Variables
var cards = [];
var userLoggedIn = false;
var currentUser = null;

// Init
let App = window.App;
let Formhandler = App.FormHandler;
let RemoteDataStore = App.RemoteDataStore;
let GMap = App.GMap;
let Autocomplete = App.Autocomplete;

let userDS = new RemoteDataStore(USER_SERVER_URL);
let cardDS = new RemoteDataStore(CARD_SERVER_URL);
let cardForm = new Formhandler(ADD_CARD_SELECTOR);
let loginForm = new Formhandler(LOGIN_SELECTOR);
let registerForm = new Formhandler(REGISTER_SELECTOR);
var map;
var autocomplete;

$(document).ready(function () {
    $(SIGNOUT_NAV_CONTAINER_SELECTOR).hide();

    initFilterBar();

    cardForm.addSubmitHandler(uploadCard);
    loginForm.addSubmitHandler(authUser);
    registerForm.addSubmitHandler(registerUser);

    // Populate cards on init
    cardDS.getAll(function (response) {
        response.forEach(function (item) {
            cardDS.emailMap[item.emailAddress] = item.id;
            cardDS.idMap[item.id] = item.emailAddress;
            item.date = item.date.substring(0, 10);
            cards = cards.concat(item);
            addCard(item);
        })
    });

    // Get users on init
    userDS.getAll(function (response) {
        response.forEach(function (item) {
            userDS.emailMap[item.email] = item.id;
            userDS.idMap[item.id] = item.email;
        })
    });

});

function initMap() {
    map = new GMap(MAP_SELECTOR);
    autocomplete = new Autocomplete(LOCATION_INPUT_SELECTOR);

    map.initMap();

    map.addEventListener(function (event) {
        var latitude = event.latLng.lat();
        var longitude = event.latLng.lng();
        let coords = {lat: latitude, lng: longitude};

        map.moveMarker(coords);

        autocomplete.setAddress(coords);
    });

    autocomplete.autocomplete.bindTo('bounds', map.map);

    autocomplete.addEventListener(function () {
        var place = autocomplete.autocomplete.getPlace();
        var coords = {
            lat: place.geometry.location['lat'](),
            lng: place.geometry.location['lng']()
        };

        map.moveMarker(coords);

        console.log(place);
    });
}

// Autocomplete.prototype.getUserLocation = function () {
//     navigator.geolocation.getCurrentPosition(function (position) {
//         let userLat = position.coords.latitude;
//         let userLng = position.coords.longitude;
//         return {"lat": userLat, "lng": userLng}
//     }, function (error) {
//         alert('Please accept location services in order to use dog-date');
//         return null;
//     });
//
//
//     let coords = this.getUserLocation();
//
//     if (!coords) {
//         return;
//     }
// };

/*
* Uploads a card to the server
* @param data The data from the form
 */
let uploadCard = function (data) {
    data.image = document.getElementById('uploadedImage').src;
    data.emailAddress = currentUser;

    cardDS.add(data.emailAddress, data, function () {
        addCard(data);
    });
};

/*
* Opens the add card form if the user is logged in
 */
let openCardForm = function () {
    if (!userLoggedIn) {
        alert("You have to be logged in to add a card!");
        return;
    }
    $("#card-modal").modal('show');
};

/*
* Opens more-modal and moves data from cards to the modal, if the user is logged in
* @param element The see more button.
 */
let showMore = function (element) {
    if (!userLoggedIn) {
        alert("You have to be logged in to see more!");
        return;
    }
    $("#more-modal").modal('show');

    let id = element.parentElement.parentElement.id;
    let cardData = $("#" + id + " " + CARD_SELECTOR);
    let modalData = $(MODAL_SELECTOR);

    modalData[0].src = cardData[0].src;
    modalData[1].innerText = cardData[1].innerText;
    modalData[2].innerText = cardData[2].innerText;
    modalData[3].innerText = cardData[3].innerText;
    modalData[4].innerText = cardData[4].innerText;
    modalData[5].innerText = cardData[5].innerText;
    modalData[6].innerText = cardData[6].innerText;
    modalData[7].innerText = cardData[7].innerText;
    let email = cardDS.idMap[id];
    modalData[8].innerText = email;

    $("#contact-btn").attr("href", "mailto:" + email +
        "?subject=Dog-date appointment&body=Hello, let's arrange a dog-date!");
};

/*
* Previews the uploaded image when adding a card
* Uses base64 format to store the img
* @param input The input element in the DOM
 */
let previewImage = function (input) {
    if (input.files && input.files[0]) {
        var reader = new FileReader();
        let $uploadedImage = $(UPLOADED_IMAGE_SELECTOR);
        reader.onload = function (e) {
            $uploadedImage.attr('src', e.target.result);
            $uploadedImage.removeClass("d-none");
        };
        reader.readAsDataURL(input.files[0]);
    }
};

let resetImage = function (input) {
    $(UPLOADED_IMAGE_SELECTOR).attr('src', 'img/placeholder.jpg');
};

/*
* Adds card from form data
 */
function addCard(data) {
    var $card = $("<div></div>", {
        "id": cardDS.emailMap[data.emailAddress],
        "class": "card col-md-3"
    });

    var $img = $("<img></img>", {
        "class": "card-image",
        "data-card": "image",
        "src": data.image
    });
    $card.append($img);

    var $cardBody = $("<div></div>", {
        "class": "card-body"
    });

    var $title = $("<h5></h5>", {
        "class": "card-title"
    });

    var $titleName = $("<span></span>", {
        "data-card": "name"
    });
    $titleName.append(data.name);
    $title.append($titleName);
    $title.append(", ");

    var $age = $("<span></span>", {
        "data-card": "age"
    });
    $age.append(data.age);

    $title.append($age);
    $title.append(" years");

    $cardBody.append($title);

    var $breed = $("<p></p>", {
        "data-card": "breed",
        "class": "font-italic font-weight-light"
    });
    $breed.append(data.breed);
    $cardBody.append($breed);

    var $description = $("<p></p>", {
        "data-card": "description",
        "class": "card-desc"
    });
    $description.append(data.details);
    $cardBody.append($description);

    var $grid = $("<div></div>", {
        "class": "card-grid"
    });

    var $iconDate = $("<i></i>", {
        "class": "fas fa-calendar-alt"
    });
    var $gridDate = $("<a></a>", {
        "class": "card-date card-grid-wide"
    });
    var $spanDate = $("<span></span>", {
        "class": "nav-text",
        "data-card": "date"
    });
    $spanDate.append(data.date);
    $gridDate.append($spanDate);
    $grid.append($iconDate);
    $grid.append($gridDate);

    var $iconTime = $("<i></i>", {
        "class": "fa fa-bell"
    });
    var $gridTime = $("<a></a>", {
        "class": "card-date card-grid-wide"
    });
    var $spanTime = $("<span></span>", {
        "class": "nav-text",
        "data-card": "time"
    });
    $spanTime.append(data.time);
    $gridTime.append($spanTime);
    $grid.append($iconTime);
    $grid.append($gridTime);

    var $iconLoc = $("<i></i>", {
        "class": "fa fa-thumb-tack"
    });
    var $gridLoc = $("<a></a>", {
        "class": "card-date card-grid-wide"
    });
    var $spanLoc = $("<span></span>", {
        "class": "nav-text",
        "data-card": "location"
    });
    $spanLoc.append(data.location);
    $gridLoc.append($spanLoc);
    $grid.append($iconLoc);
    $grid.append($gridLoc);

    var $button = $("<button></button>", {
        "class": "btn btn-primary btn-more",
        // "data-target": "#more-modal",
        // "data-toggle": "modal",
        "onclick": "showMore(this)",
        "type": "button"
    });

    $button.append("See more");

    $cardBody.append($grid);
    $cardBody.append($button);
    $card.append($cardBody);
    $("#container-card").append($card);
}