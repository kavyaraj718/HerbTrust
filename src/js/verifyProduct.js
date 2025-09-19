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
                if(result){
                    tr+="<td>"+ "Genuine Herb."+"</td>";
                }else{
                    tr+="<td>"+ "Not Genuine."+"</td>";
                }
                tr+="</tr>";
                t+=tr;

                document.getElementById('logdata').innerHTML = t;
                document.getElementById('add').innerHTML=account;
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
                            // Prepare lifecycle timeline data (partial, based on available on-chain fields)
                            var stages = [];
                            if(hd || ol){
                              stages.push({ key:'harvest', title:'🌱 Harvest', icon:'🌱', timestamp: hd, locationText: ol, actor: fid ? ('Farmer ' + fid) : '', batchId: productSN });
                            }
                            // Placeholder stages until dedicated contract events/fields exist
                            stages.push({ key:'processing', title:'🏭 Processing', icon:'🏭', timestamp:'—', locationText:'—', actor:'Processor', batchId: productSN });
                            stages.push({ key:'lab', title:'🧪 Lab Testing', icon:'🧪', timestamp:'—', locationText:'—', actor:'Lab', batchId: productSN, extra: cert ? ('Certification: ' + cert) : '' });
                            stages.push({ key:'formulation', title:'⚗️ Formulation', icon:'⚗️', timestamp:'—', locationText:'—', actor:'Formulator', batchId: productSN });
                            stages.push({ key:'retail', title:'🏪 Retail', icon:'🏪', timestamp:'—', locationText:'—', actor:'Retailer', batchId: productSN });

                            if(window.renderTimeline){ window.renderTimeline('timelineContainer', stages); }

                            // Attempt to geocode basic locations via a naive parser (expects "lat,lng" if provided)
                            var points = [];
                            var parseLatLng = function(text){
                              if(!text) return null;
                              var m = String(text).match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
                              if(!m) return null;
                              return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
                            };
                            var hCoord = parseLatLng(ol);
                            if(hCoord){ points.push({ lat:hCoord.lat, lng:hCoord.lng, icon:'🌱', title:'Harvest', subtitle: ol }); }
                            if(window.renderMap){ window.renderMap('mapContainer', points); }
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