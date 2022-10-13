#include <iostream>
using namespace std;
  
void decimalToBinary(int n) {
    int x; 
    int y = 0, i = 1;
   
    while(n != 0) {
        x = n%2;
        n = n/2;
        y= y + (x*i);
        i = i*10;
    }
    return y;
}
 
int main() {
    int decimal;
     
    cin >> decimal;
    decimalToBinary(decimal);
      
    return 0;
}
  
