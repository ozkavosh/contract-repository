//SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./IERC20.sol";

contract Marketplace {
    struct Product {
        uint id;
        string name;
        uint price;
        address seller;
        bool sold;
        address buyer;
        bool confirmed;
    }

    IERC20 public token;
    uint public productCount;
    mapping(address => uint) public stakingBalance;
    mapping(uint => Product) public products;

    event ProductListed(
        uint productId,
        string productName,
        uint productPrice,
        address seller
    );
    event ProductBought(uint productId, address buyer);
    event ProductConfirmed(uint productId, address buyer);

    constructor(address _tokenAddress) {
        token = IERC20(_tokenAddress);
    }

    function listProduct(string memory _name, uint _price) public {
        require(_price > 0, "Price must be greater than zero");

        productCount++;
        products[productCount] = Product({
            id: productCount,
            name: _name,
            price: _price * 10 ** 6,
            seller: payable(msg.sender),
            sold: false,
            buyer: payable(address(0)),
            confirmed: false
        });

        emit ProductListed(productCount, _name, _price, msg.sender);
    }

    function buyProduct(uint productId, uint $USDc) public {
        require($USDc > 0, "Amount must be greater than zero");
        require(products[productId].id == productId, "Product does not exist");
        require(products[productId].price / 10 ** 6 == $USDc, "Incorrect price");

        Product storage product = products[productId];
        require(!product.sold, "Product already sold");

        token.transferFrom(msg.sender, address(this), $USDc * 10 ** 6);

        emit ProductBought(productCount, msg.sender);

        products[productId].sold = true;
        products[productId].buyer = msg.sender;

        stakingBalance[msg.sender] =
            stakingBalance[msg.sender] +
            $USDc *
            10 ** 6;
    }

    function withdrawalTokens() public {
        uint balance = stakingBalance[msg.sender];

        require(balance > 0, "staking balance cannot be 0");

        token.transfer(msg.sender, balance);

        stakingBalance[msg.sender] = 0;
    }

    function confirmDelivery(uint _productId) public {
        Product storage product = products[_productId];
        require(
            product.buyer == msg.sender,
            "Only the buyer can confirm delivery"
        );
        require(product.sold, "Product not sold");
        require(!product.confirmed, "Delivery already confirmed");

        product.confirmed = true;
        token.approve(address(this), product.price);
        token.transferFrom(address(this), product.seller, product.price);

        stakingBalance[product.buyer] = 0;

        emit ProductConfirmed(_productId, msg.sender);
    }
}
