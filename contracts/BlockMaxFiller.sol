// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

contract BlockMaxFiller {
    uint256 public counter;
    mapping(uint256 => uint256) public dataStore;
    event Debug(uint256 iteration, uint256 value, uint256 multiplier, string message);
    
    function fillBlock() public {
        uint256 temp = 1;
        emit Debug(0, temp, 0, "Starting value");
        
        for(uint256 i = 1; i <= 3; i++) {
            temp = temp * i;
            for(uint256 k = 0; k < 3; k++) {
                dataStore[i + (k * 100)] = temp;
            }
            emit Debug(i, temp, i, "After multiply and store");
        }
        
        for(uint256 j = 0; j < 100; j++) {
            dataStore[j + 1000] = temp;
            if(j % 50 == 0) {
                emit Debug(j + 21, temp, j, "Additional storage");
            }
        }
    }

    function clearStorage() public {
        for(uint256 j = 0; j < 1000; j++) {
            dataStore[j] = 0;
            dataStore[j + 1000] = 0;
        }
    }
} 