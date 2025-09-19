App = {
    web3Provider: null,
    contracts: {},

    init: async function() {
        return await App.initWeb3();
    },

    initWeb3: function() {
        if (window.ethereum) {
            App.web3Provider = window.ethereum;
        } else if (window.web3) {
            App.web3Provider = window.web3.currentProvider;
        } else {
            App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
        }

        web3 = new Web3(App.web3Provider);
        return App.initContract();
    },

    initContract: function() {

        $.getJSON('product.json',function(data){

            var productArtifact=data;
            App.contracts.product=TruffleContract(productArtifact);
            App.contracts.product.setProvider(App.web3Provider);
        });

        return App.bindEvents();
    },

    bindEvents: function() {

        $(document).on('click','.btn-register',App.getData);
    },

    getData:function(event) {
        event.preventDefault();
        var productSN = document.getElementById('productSN').value;
        var consumerCode = document.getElementById('consumerCode').value;
        var productInstance;
        //window.ethereum.enable();
        web3.eth.getAccounts(function(error,accounts){

            if(error) {
                console.log(error);
            }

            var account=accounts[0];
            // console.log(account);
            App.contracts.product.deployed().then(function(instance){

                productInstance=instance;
                return productInstance.verifyProduct(web3.fromAscii(productSN), web3.fromAscii(consumerCode),{from:account});

            }).then(function(result){
                
                // console.log(result);

                var t= "";

                var tr="<tr>";
                var isGenuine = !!result;
                if(isGenuine){ tr+="<td>Genuine Herb.</td>"; } else { tr+="<td>Not Genuine.</td>"; }
                tr+="</tr>";
                t+=tr;

                document.getElementById('logdata').innerHTML = t;
                document.getElementById('add').innerHTML=account;
                // Toggle details, distributor and map visibility based on genuineness
                try {
                  var detailsCard = document.getElementById('herbDetailsCard');
                  var mapCard = document.getElementById('mapCard');
                  var distCard = document.getElementById('distributorCard');
                  if(!isGenuine){
                    if(detailsCard) detailsCard.style.display = 'none';
                    if(mapCard) mapCard.style.display = 'none';
                    if(distCard) distCard.style.display = 'none';
                  } else {
                    if(detailsCard) detailsCard.style.display = '';
                    if(mapCard) mapCard.style.display = '';
                    if(distCard) distCard.style.display = '';
                  }
                } catch(e) {}
                // Populate herb details ALWAYS (regardless of verification status)
                try {
                    var snBytes32 = web3.fromAscii(productSN);
                    var idx = null;
                    var contractRef;
                    App.contracts.product.deployed().then(function(instance){
                        contractRef = instance;
                        return contractRef.viewProductItems.call();
                    }).then(function(all){
                        var ids = all[0];
                        var sns = all[1];
                        var names = all[2];
                        var brands = all[3];
                        var prices = all[4];
                        var status = all[5];
                        for(var i=0;i<sns.length;i++){
                            if(web3.toAscii(sns[i]).replace(/\u0000/g,'') === productSN){ idx = i; break; }
                        }
                        var setText = function(id, value){ var el = document.getElementById(id); if(el){ el.textContent = value; } };
                        if(idx !== null){
                            setText('herbName', web3.toAscii(names[idx]).replace(/\u0000/g,''));
                            setText('herbSpecies', web3.toAscii(brands[idx]).replace(/\u0000/g,''));
                            setText('herbUnitPrice', prices[idx]);
                            // Fetch producer/manufacturer ID from public mapping productsManufactured
                            return contractRef.productsManufactured.call(snBytes32).then(function(pid){
                                setText('producerId', web3.toAscii(pid).replace(/\u0000/g,''));
                            }).catch(function(){ setText('producerId', '—'); });
                        }
                        return null;
                    }).then(function(){
                        // Read on-chain herb metadata if set
                        return productInstance.getHerbMetadata.call(snBytes32).then(function(meta){
                            var hd = web3.toAscii(meta[0]).replace(/\u0000/g,'');
                            var ol = web3.toAscii(meta[1]).replace(/\u0000/g,'');
                            var fid = web3.toAscii(meta[2]).replace(/\u0000/g,'');
                            var cert = web3.toAscii(meta[3]).replace(/\u0000/g,'');
                            var setText = function(id, value){ var el = document.getElementById(id); if(el){ el.textContent = value; } };
                            setText('herbHarvestDate', hd || '—');
                            setText('herbOriginLocation', ol || '—');
                            setText('herbFarmId', fid || '—');
                            setText('herbCertification', cert || '—');
                            // Timeline removed per requirements

                            // Attempt to geocode basic locations via a naive parser (expects "lat,lng" if provided)
                            var points = [];
                            var parseLatLng = function(text){
                              if(!text) return null;
                              var m = String(text).match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
                              if(!m) return null;
                              return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
                            };
                            var hCoord = parseLatLng(ol);
                            function render(points){ if(window.renderMap){ window.renderMap('mapContainer', points); } }
                            if(hCoord){
                              points.push({ lat:hCoord.lat, lng:hCoord.lng, icon:'🌱', title:'Origin Location', subtitle: ol });
                              render(points);
                            } else if(ol && ol.trim()){
                              try {
                                var q = encodeURIComponent(ol.trim());
                                fetch('https://nominatim.openstreetmap.org/search?format=json&q=' + q, { headers: { 'Accept': 'application/json' } })
                                  .then(function(r){ return r.json(); })
                                  .then(function(rows){
                                    if(Array.isArray(rows) && rows.length){
                                      var r0 = rows[0];
                                      var lat = parseFloat(r0.lat);
                                      var lng = parseFloat(r0.lon);
                                      if(!isNaN(lat) && !isNaN(lng)){
                                        points.push({ lat:lat, lng:lng, icon:'🌱', title:'Origin Location', subtitle: ol });
                                      }
                                    }
                                  })
                                  .catch(function(){ /* ignore geocode errors */ })
                                  .finally(function(){ render(points); });
                              } catch(e){ render(points); }
                            } else {
                              render(points);
                            }
                            // Fetch distributor details: derive seller code from productsForSale mapping; then match in sellers list
                            try {
                              var sellerCodeBytes;
                              return contractRef.productsForSale.call(snBytes32).then(function(sc){
                                sellerCodeBytes = sc;
                                var sellerCode = web3.toAscii(sc).replace(/\u0000/g,'');
                                if(!sellerCode){ throw new Error('No distributor assigned'); }
                                // get all sellers to find matching code
                                return contractRef.viewSellers.call().then(function(sres){
                                  var snames = sres[1];
                                  var sbrands = sres[2];
                                  var scodes = sres[3];
                                  var snums = sres[4];
                                  var smanagers = sres[5];
                                  var saddress = sres[6];
                                  var foundIndex = -1;
                                  for(var i=0;i<scodes.length;i++){
                                    if(web3.toAscii(scodes[i]).replace(/\u0000/g,'') === sellerCode){ foundIndex = i; break; }
                                  }
                                  if(foundIndex >= 0){
                                    var setText = function(id, value){ var el = document.getElementById(id); if(el){ el.textContent = value; } };
                                    setText('distName', web3.toAscii(snames[foundIndex]).replace(/\u0000/g,''));
                                    setText('distBrand', web3.toAscii(sbrands[foundIndex]).replace(/\u0000/g,''));
                                    setText('distCode', sellerCode);
                                    setText('distNumber', snums[foundIndex]);
                                    setText('distManager', web3.toAscii(smanagers[foundIndex]).replace(/\u0000/g,''));
                                    setText('distAddress', web3.toAscii(saddress[foundIndex]).replace(/\u0000/g,''));
                                  }
                                });
                              });
                            } catch(e) { /* ignore */ }
                        });
                    }).catch(function(e){ console.log(e); });
                } catch(e){ console.log(e); }
           }).catch(function(err){
               console.log(err.message);
           })
        })
    }
};

$(function() {
    $(window).load(function() {
        App.init();
    })
})