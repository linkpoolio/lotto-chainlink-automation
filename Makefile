-include .env

deploy:
	npx hardhat run --network ${NETWORK} scripts/deploy.ts

test-contracts: 
	npx hardhat test

coverage:
	npx hardhat coverage
