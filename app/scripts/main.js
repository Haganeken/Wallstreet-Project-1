//TODO: Add edit feature, and delete inside edit modal
//TODO: Sort by functionality
//TODO: oauth
//TODO: feature to animate bars (hint use 'fade' class)

// Constants
let ADD_CARD_SELECTOR = "#add-card-form";
let LOGIN_SELECTOR = "#login-form";
let REGISTER_SELECTOR = "#register-form";
let CARD_DATA_SELECTOR = "[data-card]";
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
let DATE_FILTER_SELECTOR = '#date-filter';
let CONTAINER_CARD_SELECTOR = ".container-card";
let LOGIN_RESPONSE_SELECTOR = "#login-response";
let REGISTER_RESPONSE_SELECTOR = "#register-response";
let MODAL_LOCATION_SELECTOR = "[data-modal=location]";
let CARDS_SELECTOR = ".card";
let WELCOME_MESSAGE_SELECTOR = '#currentUser';


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

    cardForm.addSubmitHandler(getSubmitAction);
    loginForm.addSubmitHandler(authUser);
    registerForm.addSubmitHandler(registerUser);

    // Populate cards on init
    cardDS.getAll(function (response) {
        response.forEach(function (item) {
            cardDS.emailMap[item.emailAddress] = item.id;
            cardDS.idMap[item.id] = item.emailAddress;
            item.date = item.date.substring(0, 10);
            cards = cards.concat(item);

            if (!user_location) {
                getUserLocation(function () {
                    addCard(item);
                });
            } else {
                addCard(item);
            }
        });

        cardsVisible = cards.length;
        filterCards();
    });

    // Get users on init
    userDS.getAll(function (response) {
        response.forEach(function (item) {
            userDS.emailMap[item.email] = item.id;
            userDS.idMap[item.id] = item.email;
        })
    });

    $("#card-modal").on('hidden.bs.modal', function () {
        let $buttons = $("#card-modal .modal-footer");
        $("#deleteBtn").remove();
        $("#image").attr('required', true);

        $buttons.children()[0].innerHTML = "Close";
        $buttons.children()[1].innerHTML = "Create Event";
    })
});


function addEditButton(card) {
    let $card = $('#' + card.id);
    let $icon = $("<i></i>", {
        "class": "fas fa-pencil-alt edit-icon"
    });
    let $text = $("<p></p>", {
        "class": "edit-text"
    });
    let $bar = $("<button></button>", {
        "class": "edit-bar",
        "type": "button",
        "onclick": "editCardModal(this)"
    });
    $text.append("Edit");
    $bar.append($icon);
    $bar.append($text);
    $card.append($bar);
}

function editCardModal(card) {
    let $cardModal = $("#card-modal .form-group");
    $("#image").attr('required', false);

    let $buttons = $("#card-modal .modal-footer");
    let $deletebtn = $("<button></button>", {
        "id": "deleteBtn",
        "class": "btn btn-secondary",
        "type": "submit",
        "onclick": "removeCard()"
    });
    $deletebtn.text("Delete");
    $buttons.prepend($deletebtn);

    $buttons.children()[1].innerHTML = "Discard Changes";
    $buttons.children()[2].innerHTML = "Save Changes";

    let cardId = card.parentElement.id;
    $("#submit").data().cardId = cardId;

    cardDS.get(cardId, function (response) {
        $(UPLOADED_IMAGE_SELECTOR).attr('src', response.image);
        $cardModal[0].children[1].value = response.name;
        $cardModal[1].children[1].value = response.age;
        $cardModal[2].children[1].value = response.breed;
        $cardModal[3].children[1].value = response.details;
        var time = new Date(response.date);
        $cardModal[4].children[1].value = time.customFormat("#YYYY#-#MM#-#DD#");
        $cardModal[5].children[1].value = response.time;
        $cardModal[6].children[1].value = response.location;

        response.latlng['lat'] = Number(response.latlng['lat']);
        response.latlng['lng'] = Number(response.latlng['lng']);

        map.moveMarker(response.latlng);

        $("#card-modal").modal('show');
    });
}

function displayEditButtons() {
    $(CARDS_SELECTOR).each(function (index, card) {
        if (cardDS.idMap[card.id] === currentUser) {
            addEditButton(card);
        }
    })
}

function hideEditButtons() {
    $(".edit-bar").remove();
}

let getAddressFromCoordinates = function (coords, cb) {
    let latlng = "latlng=" + coords['lat'] + "," + coords['lng'];
    let API_KEY = "key=AIzaSyCTLJXDOMiF29v6kSlOxCZZZ2I3cXZJtco";
    let url = "https://maps.googleapis.com/maps/api/geocode/json?" + latlng + "&" + API_KEY;

    $.ajax({
        url: url,
        success: function (data) {
            let address = data.results[0]; // Choose first address in results list
            cb(address);
        }
    });
};

let getDirections = function () {
    var url = "https://www.google.dk/maps/dir/";
    getAddressFromCoordinates(user_location, function (address) {
        url += encodeURI(address.formatted_address);
        url += "/" + encodeURI($(MODAL_LOCATION_SELECTOR).text());
        window.open(url);
    });
};

let getUserLocation = function (cb) {
    navigator.geolocation.getCurrentPosition(function (position) {
        user_location = {"lat": position.coords.latitude, "lng": position.coords.longitude};
        cb()
    }, function (error) {
        alert('Please accept location services in order to use dog-date');
        user_location = null;
    });
};

function initMap() {
    map = new GMap(MAP_SELECTOR);
    autocomplete = new Autocomplete(LOCATION_INPUT_SELECTOR);

    getUserLocation(function () {
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
    });

}

function removeCard() {
    let cardId = $("#submit").data().cardId;
    cardDS.remove(cardId);
    $("#" + cardId).remove();
}

function editCard(data) {
    cardDS.update(data.cardId, data, function (response) {
        let cardData = $("#" + response.id + " " + CARD_DATA_SELECTOR);

        cardData[0].src = response.image;
        cardData[1].innerHTML = response.name;
        cardData[2].innerHTML = response.age;
        cardData[3].innerHTML = response.breed;
        cardData[4].innerHTML = response.details;
        var time = new Date(response.date);
        cardData[5].innerHTML = time.customFormat("#YYYY#-#MM#-#DD#");
        cardData[6].innerHTML = response.time;
        cardData[7].innerHTML = response.location;
        response.latlng['lat'] = Number(response.latlng['lat']);
        response.latlng['lng'] = Number(response.latlng['lng']);
        cardData[8].innerHTML = getDistance(user_location, response.latlng).toPrecision(2) + " km";
    })
}

/*
* Uploads a card to the server
* @param data The data from the form
 */
let getSubmitAction = function (data) {
    let $submitBtn = $("#submit");
    let btnText = $submitBtn.text();
    let image = $(UPLOADED_IMAGE_SELECTOR);

    data.image = image.attr('src');
    data.cardId = $submitBtn.data().cardId;

    image.attr('src', 'img/placeholder.jpg');

    let address = "address=" + encodeURI(data.location);
    getAddressCoordinates(address, function (latlng) {
        data.latlng = latlng;
        if (btnText === "Create Event") {
            uploadCard(data);
        } else if (btnText === "Save Changes") {
            editCard(data);
        }
    });
    $("#card-modal").modal('hide');
};

function uploadCard(data) {
    data.emailAddress = currentUser;

    cardDS.add(data.emailAddress, data, function () {
        addCard(data);
        cards.concat(data);
        filterCards();
    });
}

let getAddressCoordinates = function (address, cb) {
    let API_KEY = "key=AIzaSyCTLJXDOMiF29v6kSlOxCZZZ2I3cXZJtco";
    let url = "https://maps.googleapis.com/maps/api/geocode/json?" + address + "&" + API_KEY;
    $.ajax({
        url: url,
        success: function (data) {
            // Choose first matching address
            cb(data.results[0].geometry.location);
        }
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
    resetCardModal();
    $("#card-modal").modal('show');
};

function resetCardModal() {
    let $cardModal = $("#card-modal .form-group");
    $(UPLOADED_IMAGE_SELECTOR).attr('src', 'img/placeholder.jpg');
    $cardModal[0].children[1].value = "";
    $cardModal[1].children[1].value = "";
    $cardModal[2].children[1].value = "";
    $cardModal[3].children[1].value = "";
    $cardModal[4].children[1].value = "";
    $cardModal[5].children[1].value = "";
    $cardModal[6].children[1].value = "";

    map.moveMarker(user_location);
    map.deleteMarker();
}

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
    let cardData = $("#" + id + " " + CARD_DATA_SELECTOR);
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
        "class": "fas fa-clock"
    });
    var $gridTime = $("<a></a>", {
        "class": "card-time card-grid-wide"
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
        "class": "fas fa-map-marker-alt"
    });
    var $gridLoc = $("<a></a>", {
        "class": "card-location card-grid-wide"
    });
    var $spanLoc = $("<span></span>", {
        "class": "nav-text",
        "data-card": "location"
    });
    $spanLoc.append(data.location);
    $gridLoc.append($spanLoc);
    $grid.append($iconLoc);
    $grid.append($gridLoc);

    var $iconDist = $("<i></i>", {
        "class": "fas fa-road"
    });
    var $gridDist = $("<a></a>", {
        "class": "card-distance card-grid-wide"
    });
    var $spanDist = $("<span></span>", {
        "class": "nav-text",
        "data-card": "distance"
    });
    $spanDist.append(getDistance(data.latlng, user_location).toPrecision(2) + " km");
    $gridDist.append($spanDist);
    $grid.append($iconDist);
    $grid.append($gridDist);

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

//*** This code is copyright 2002-2016 by Gavin Kistner, !@phrogz.net
//*** It is covered under the license viewable at http://phrogz.net/JS/_ReuseLicense.txt
Date.prototype.customFormat = function (formatString) {
    var YYYY, YY, MMMM, MMM, MM, M, DDDD, DDD, DD, D, hhhh, hhh, hh, h, mm, m, ss, s, ampm, AMPM, dMod, th;
    YY = ((YYYY = this.getFullYear()) + "").slice(-2);
    MM = (M = this.getMonth() + 1) < 10 ? ('0' + M) : M;
    MMM = (MMMM = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][M - 1]).substring(0, 3);
    DD = (D = this.getDate() + 1) < 10 ? ('0' + D) : D;
    DDD = (DDDD = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][this.getDay()]).substring(0, 3);
    th = (D >= 10 && D <= 20) ? 'th' : ((dMod = D % 10) == 1) ? 'st' : (dMod == 2) ? 'nd' : (dMod == 3) ? 'rd' : 'th';
    formatString = formatString.replace("#YYYY#", YYYY).replace("#YY#", YY).replace("#MMMM#", MMMM).replace("#MMM#", MMM).replace("#MM#", MM).replace("#M#", M).replace("#DDDD#", DDDD).replace("#DDD#", DDD).replace("#DD#", DD).replace("#D#", D).replace("#th#", th);
    h = (hhh = this.getHours());
    if (h == 0) h = 24;
    if (h > 12) h -= 12;
    hh = h < 10 ? ('0' + h) : h;
    hhhh = hhh < 10 ? ('0' + hhh) : hhh;
    AMPM = (ampm = hhh < 12 ? 'am' : 'pm').toUpperCase();
    mm = (m = this.getMinutes()) < 10 ? ('0' + m) : m;
    ss = (s = this.getSeconds()) < 10 ? ('0' + s) : s;
    return formatString.replace("#hhhh#", hhhh).replace("#hhh#", hhh).replace("#hh#", hh).replace("#h#", h).replace("#mm#", mm).replace("#m#", m).replace("#ss#", ss).replace("#s#", s).replace("#ampm#", ampm).replace("#AMPM#", AMPM);
};