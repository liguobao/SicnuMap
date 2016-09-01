﻿
$(function () {
    map = new AMap.Map("container", {
        resizeEnable: true,
        zoomEnable: true,
        center: [104.20148, 30.565967],
        zoom: 17
    });

    scale = new AMap.Scale();
    map.addControl(scale);

    arrivalRange = new AMap.ArrivalRange();



    infoWindow = new AMap.InfoWindow({
        offset: new AMap.Pixel(0, -30)
    });

    var auto = new AMap.Autocomplete({
        input: "work-location"
    });

    AMap.event.addListener(auto, "select", workLocationSelected);

    //$.getJSON("pv.json", function (data) {
    //    $("#lblPVCount").text(data.PVCount);
    //});

    //初始化打开侧边栏
   // $('#search-offcanvas').offCanvas({ effect: 'overlay' });

    //将上面input自动补全结果置于页面最上层
    $(".amap-sug-result").css("z-index", 9999);
    
   

})


function MapMoveToLocationCity() {
    map.on('moveend', getCity);
    function getCity() {
        map.getCity(function (data) {
            if (data['province'] && typeof data['province'] === 'string') {

                var cityinfo = (data['city'] || data['province']);
                cityName = cityinfo.substring(0, cityinfo.length - 1);
                ConvertCityCNNameToShortCut();

                document.getElementById('IPLocation').innerHTML = '地图中心所在城市：' + cityName;

            }
        });
    }
}


function LacationTypeChange() {
    if ($("input[name='lacationType']:checked").val() == '1') {
        showCityInfo(map);

    } else {
        MapMoveToLocationCity();
    }
}

function showCityInfo(map) {
    //实例化城市查询类
    var citysearch = new AMap.CitySearch();
    //自动获取用户IP，返回当前城市
    citysearch.getLocalCity(function (status, result) {
        if (status === 'complete' && result.info === 'OK') {
            if (result && result.city && result.bounds) {
                var cityinfo = result.city;
                var citybounds = result.bounds;
                cityName = cityinfo.substring(0, cityinfo.length - 1);

                document.getElementById('IPLocation').innerHTML = '您当前所在城市：' + cityName;
                //地图显示当前城市
                map.setBounds(citybounds);
            }
        } else {
            document.getElementById('IPLocation').innerHTML = result.info;
        }
    });
}



function takeBus(radio) {
    vehicle = radio.value;
    loadWorkLocation()
}

function takeSubway(radio) {
    vehicle = radio.value;
    loadWorkLocation()
}


function workLocationSelected(e) {
    workAddress = e.poi.name;
    loadWorkLocation();
}

function takeWalking(radio) {
    vehicle = radio.value;
    loadWorkLocation();
}


function loadWorkMarker(x, y, locationName) {
    workMarker = new AMap.Marker({
        map: map,
        title: locationName,
        icon: 'http://webapi.amap.com/theme/v1.3/markers/n/mark_r.png',
        position: [x, y]

    });
}


function loadWorkRange(x, y, t, color, v) {
    arrivalRange.search([x, y], t, function (status, result) {
        if (result.bounds) {
            for (var i = 0; i < result.bounds.length; i++) {
                var polygon = new AMap.Polygon({
                    map: map,
                    fillColor: color,
                    fillOpacity: "0.4",
                    strokeColor: color,
                    strokeOpacity: "0.8",
                    strokeWeight: 1
                });
                polygon.setPath(result.bounds[i]);
                polygonArray.push(polygon);
            }
        }
    }, {
        policy: v
    });
}

function addMarkerByAddress(address, href,markBG) {
    var geocoder = new AMap.Geocoder({
        city: cityName,
        radius: 1000
    });

   

    geocoder.getLocation(address, function (status, result) {
        if (status === "complete" && result.info === 'OK') {
            var geocode = result.geocodes[0];
            rentMarker = new AMap.Marker({
                map: map,
                title: address,
                position: [geocode.location.getLng(), geocode.location.getLat()]
            });
            rentMarkerArray.push(rentMarker);

            //rentMarker.setLabel({//label默认蓝框白底左上角显示，样式className为：amap-marker-label
            //    offset: new AMap.Pixel(-28, 38),//修改label相对于maker的位置
            //    content: "租金：" + price
            //});

            rentMarker.content = "<div><a target = '_blank' href='" + href + "'>" + address + "<br/></a><div>";
            rentMarker.on('click', function (e) {
                addTransfer(e, address);
            });
        }
    })
}



function addTransfer(e, address) {
    if (vehicle != 'WALKING') {
        infoWindow.setContent(e.target.content);
        infoWindow.open(map, e.target.getPosition());
        if (amapTransfer) amapTransfer.clear();
        amapTransfer = new AMap.Transfer({
            map: map,
            policy: AMap.TransferPolicy.LEAST_TIME,
            city: cityName,
            panel: 'transfer-panel'
        });
        amapTransfer.search([{
            keyword: workAddress
        }, {
            keyword: address
        }], function (status, result) { })
    } else {
        infoWindow.setContent(e.target.content);
        infoWindow.open(map, e.target.getPosition());
        if (amapTransfer) amapTransfer.clear();

        amapTransfer = new AMap.Walking({
            map: map,
            panel: "transfer-panel",
            city: cityName,
        });

        amapTransfer.search([
            { keyword: workAddress },
            { keyword: address }
        ], function (status, result) {
        });
    }
}




function delWorkLocation() {
    if (polygonArray) map.remove(polygonArray);
    if (workMarker) map.remove(workMarker);
    polygonArray = [];
}

function delRentLocation() {
    if (rentMarkerArray) map.remove(rentMarkerArray);
    rentMarkerArray = [];
}

function loadWorkLocation() {
    delWorkLocation();
    var geocoder = new AMap.Geocoder({
        city: cityName,
        radius: 1000
    });

    geocoder.getLocation(workAddress, function (status, result) {
        if (status === "complete" && result.info === 'OK') {
            var geocode = result.geocodes[0];
            x = geocode.location.getLng();
            y = geocode.location.getLat();
            loadWorkMarker(x, y);
            loadWorkRange(x, y, 60, "#3f67a5", vehicle);
            map.setZoomAndCenter(12, [x, y]);
        }
    })
}