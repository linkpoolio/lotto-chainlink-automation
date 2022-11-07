
deploy:
	npx hardhat run --network localhost scripts/deploy.ts

test-contracts: 
	npx hardhat test

coverage:
	npx hardhat coverage