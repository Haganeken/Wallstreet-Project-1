/*
* Initializes the sub-components of the filter bar
*/
function initFilterBar() {
    initAgeSlider();
    initTimeSlider();
    initStickyFilter();
    initDropdown();
    initLocationCheckboxes();
    initDateFilter();
}

/*
* Filter variables
*/
var date_start;
var date_end;
var age;
var time_start;
var time_end;

let filterCards = function () {
    cards.forEach(function (item) {
        let longItemDate = Date.parse(item.date);
        let longDate1 = Date.parse(date_start);
        let longDate2 = Date.parse(date_end);

        if ((longItemDate < longDate1) ||
            (longItemDate > longDate2) ||
            (item.age < age) ||
            ((item.time.substr(0, 2) < time_start) || (item.time.substr(0, 2) > time_end))) {
            $("#" + item.id).hide();
        } else {
            $("#" + item.id).show();
        }
    });
};

/*
* Filters the cards by date
 */
let filterDate = function (start, end) {
    date_start = start.format('YYYY-MM-DD');
    date_end = end.format('YYYY-MM-DD');

    filterCards();

    let str = '';
    str += date_start ? date_start + ' to ' : '';
    str += date_end ? date_end : '...';
    document.getElementById('date-filter').value = str;
};

/*
* Filters the cards by age
 */
let filterAge = function (age_val) {
    age = age_val;
    filterCards();
};

/*
* Filters the cards by time
 */
let filterTime = function (t1, t2) {
    time_start = t1;
    time_end = t2;
    filterCards();
};

/*
* Stops the dropdown from disappearing when clicking inside the dropdown menu
*/
let initDropdown = function () {
    $('.dropdown-menu').on("click.bs.dropdown", function (event) {
        event.stopPropagation();
        // event.preventDefault();
    });
    $('.form-control').on("click.bs.dropdown", function (event) {
        event.stopPropagation();
        // event.preventDefault();
    });
};

/*
* Adds a click event to all location filters
*/
let initLocationCheckboxes = function () {
    var checkboxes = $(".btn-group-toggle label input");
    checkboxes.click(function (event) {
        $('label.btn.tag-btn.btn-lg').each(function () {
            this.setAttribute("style", "");
        });
        checkboxClick(event);
    });
};

/*
* Adds color to the selected location filter
*/
var checkboxClick = function (event) {
    var target = event.currentTarget;
    let parent = target.parentElement;

    parent.setAttribute("style", "background-color: var(--color-dark-red)");

    $("#location-filter").text("<" + target.value + "km");

};

/*
* Updates values when dragging the age slider
*/
let initAgeSlider = function () {
    let slider = document.getElementById("ageSlider");
    let output = document.getElementById("ageButtonText");

    output.innerHTML = slider.value; // Display the default slider value

    // Update the current slider value
    slider.oninput = function () {
        output.innerHTML = this.value;
        filterAge(this.value);
    };
};

/*
* Initializes the time range-slider and updates values when dragging the range-slider
*/
let initTimeSlider = function () {
    let $timeSlider = $("#timeSlider");
    let $timeText = $("#timeText");
    let $timeButtonText = $("#timeButtonText");

    $timeSlider.slider({
        range: true,
        min: 0,
        max: 23,
        values: [1, 23],
        slide: function (event, ui) {
            $timeText.val(ui.values[0] + ":00 - " + ui.values[1] + ":00");
            $timeButtonText.text($timeText.val());
            filterTime(ui.values[0], ui.values[1]);
        }
    });

    $timeText.val($timeSlider.slider("values", 0) +
        ":00 - " + $timeSlider.slider("values", 1) + ":00");
    $timeButtonText.text($timeText.val());
};

/*
* Sticks the filterbar to the top when scrolled out of view
*/
let initStickyFilter = function () {
    window.onscroll = function () {
        toggleSticky()
    };

    let filterBar = document.getElementById("filterbar");
    let cardContainer = document.getElementById("container-card");
    // Get the offset position of the
    var sticky = filterBar.offsetTop;

    // Add the sticky class to the navbar when you reach its scroll position. Remove "sticky" when you leave the scroll position
    function toggleSticky() {
        if (window.pageYOffset >= sticky) {
            filterBar.classList.add("sticky-top");
            cardContainer.classList.add("mt-5");
        } else {
            filterBar.classList.remove("sticky-top");
            cardContainer.classList.remove("mt-5");
        }
    }
};

/*
* Initializes the date picker
*/
let initDateFilter = function () {
    var picker = new Lightpick({
        field: document.getElementById('date-filter'),
        repick: true,
        singleDate: false,
        startDate: moment().startOf('month').add(7, 'day'),
        endDate: moment().endOf('month').subtract(7, 'day'),
        onSelect: function (start, end) {
            filterDate(start, end);
        }
    });
};