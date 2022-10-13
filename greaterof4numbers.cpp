#include<bits/stdc++.h>
using namespace std;

int main(){
    int x, y, z, a;
    cout << "enter four number"<<"\n";
    cin >> x >> y >> z >> a;
	if(x > y) {
		if(x > z) {
			if(x > a) {
				cout << x;
			}
			else {
				cout << a;
			}
		}
		else {
			if(z > a) {
				cout << z;
			}
			else {
				cout << a;
			}
		}
	}
	else {
		if(y > z) {
			if(y > a) {
				cout << y;
			}
			else {
				cout << a;
			}
		}
		else {
			if(z > a) {
				cout << z;
			}
			else {
				cout << a;
			}
		}
	}    
    return 0;
}
