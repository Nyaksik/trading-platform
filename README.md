# Trading platform contract Project

# Link

- **[Link to the trading platform](https://rinkeby.etherscan.io/address/0x64121245F3bD7dBebd179aa16eFf7175FBEfffC6)** Rinkeby testnet)
- **[Link to the tokenERC20](https://rinkeby.etherscan.io/address/0x9E3bC657c2F716d310F96459b4A1F8Ba9ae552AD)** (Rinkeby testnet)

# Basic commands

## Use it to compile the contract

```TypeScript
npx hardhat clean && npx hardhat compile
// or
npm run compile
```

## Use it to deploy the contract locally

```TypeScript
npx hardhat run scripts/deploy.ts --network localhost
// or
npm run local
```

## Use it to deploy the contract in the rinkeby test network

```TypeScript
npx hardhat run scripts/deploy.ts --network rinkeby
// or
npm run rinkeby
```

## Use it to test

```TypeScript
npx hardhat test
// or
npm run test
```

## Use it to view the test coverage

```TypeScript
npx hardhat coverage
// or
npm run coverage
```

## Use it to view global options and available tasks

```TypeScript
npx hardhat help
// or
npm run help
```

# Basic task

## registration

**Use to register**

```TypeScript
npx hardhat registation --network [NETWORK]
```

## buy

**Use to buy tokens during the sale round**

```TypeScript
npx hardhat buy --eth [ETH_AMOUNT] --network [NETWORK]
```

## create

**Use to create an order**

```TypeScript
npx hardhat create --amount [AMOUNT_TOKENS] --price [ETHEREUM_PRICE] --network [NETWORK]
```

## buyOrder

**Use to buy an order**

```TypeScript
npx hardhat buyOrder --id [ORDER_ID] --eth [ETHEREUM_AMOUNT] --network [NETWORK]
```

## finish

**Use to cancel order**

```TypeScript
npx hardhat finish --id [ORDER_ID] --network [NETWORK]
```
