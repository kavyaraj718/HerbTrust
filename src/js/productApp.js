App = {

    web3Provider: null,
    contracts: {},

    init: async function() {
        return await App.initWeb3();
    },

    initWeb3: function() {
        if(window.web3) {
            App.web3Provider=window.web3.currentProvider;
        } else {
            App.web3Provider=new Web3.proviers.HttpProvider('http://localhost:7545');
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

        $(document).on('click','.btn-register',App.registerProduct);
    },

    registerProduct: function(event) {
        event.preventDefault();

        var productInstance;

        var manufacturerID = document.getElementById('manufacturerID').value;
        var productName = document.getElementById('productName').value;
        var productSN = document.getElementById('productSN').value;
        var productBrand = document.getElementById('productBrand').value;
        var productPrice = document.getElementById('productPrice').value;
        var harvestDate = document.getElementById('harvestDate') ? document.getElementById('harvestDate').value : '';
        var originLocation = document.getElementById('originLocation') ? document.getElementById('originLocation').value : '';
        var farmId = document.getElementById('farmId') ? document.getElementById('farmId').value : '';
        var certification = document.getElementById('certification') ? document.getElementById('certification').value : '';

        //window.ethereum.enable();
        web3.eth.getAccounts(function(error,accounts){

            if(error) {
                console.log(error);
            }

            console.log(accounts);
            var account=accounts[0];
            // console.log(account);

            App.contracts.product.deployed().then(function(instance){
                productInstance=instance;
                return productInstance.addProduct(web3.fromAscii(manufacturerID),web3.fromAscii(productName), web3.fromAscii(productSN), web3.fromAscii(productBrand), productPrice, {from:account});
             }).then(function(result){
                if(harvestDate || originLocation || farmId || certification){
                    return productInstance.setHerbMetadata(
                        web3.fromAscii(productSN),
                        web3.fromAscii(harvestDate),
                        web3.fromAscii(originLocation),
                        web3.fromAscii(farmId),
                        web3.fromAscii(certification),
                        {from:account}
                    );
                }
                return null;
            }).then(function(){
                document.getElementById('manufacturerID').value='';
                document.getElementById('productName').value='';
                document.getElementById('productSN').value='';
                document.getElementById('productBrand').value='';
                document.getElementById('productPrice').value='';
                if(document.getElementById('harvestDate')) document.getElementById('harvestDate').value='';
                if(document.getElementById('originLocation')) document.getElementById('originLocation').value='';
                if(document.getElementById('farmId')) document.getElementById('farmId').value='';
                if(document.getElementById('certification')) document.getElementById('certification').value='';
            }).catch(function(err){
                console.log(err.message);
            });
        });
    }



};

$(function() {

    $(window).load(function() {
        App.init();
    })
})

