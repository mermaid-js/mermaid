#include <stdio.h>
#include <stdlib.h>

struct Array{
    int A[10];
    int size;
    int length;
};

//! Displaying an array;
void Display(struct Array arr){
    printf("The series of Array is: ");
    for (int i = 0; i < arr.length; i++)
        printf("%d\t", arr.A[i]);
}

//! Append elements in last: 
void AppendElement(struct Array *arr, int x){
    if (arr->length < arr->size)
        arr->A[arr->length++] = x;
    /*
    if (arr->length < arr->size){
        arr->A[arr->length] = x;
        arr->length++;
    }
    */
}

//! Inserting element in array:
void Insert(struct Array *arr, int index, int x){
    if(index-1 >= 0 && index-1 <= arr->length){
        for (int i = arr->length; i > index-1; i--){
            arr->A[i] = arr->A[i-1];
        }
        arr->A[index-1] = x;
        arr->length++;
    }
    else
        printf("\nInvalid Data");
}

//! Deleting Element in array:
int DeleteElement(struct Array *arr, int index){
    int x = arr->A[index-1];
    if (index-1 > 0 && index-1 < arr->length){
        for (int i = index-1; i <= arr->length; i++ ){
            arr->A[i] = arr->A[i+1];
        }
        arr->length--;
    }
    else
        printf("\nData Invalid");
    return x;
}

//! Creating an Swap Function
void swapValues(int *x, int *y){
    int temp;
    temp = *x;
    *x = *y;
    *y = temp; 
}

//! For liner Search(bubble sort), using swap fuction
// each time we search for eleemnt it gonna swap with the back element 
int linearSearch(struct Array *arr, int key){
    for (int i = 0; i < arr->length; i++){
        if (key == arr->A[i]){
            swapValues(&arr->A[i], &arr->A[i-1]);
            return i+1;
        }
        return -1;  //not working for this compiler
    }
}

//! for binary search and array must be sorted
// iterative version(using loops);
int BinarySearch(struct Array arr, int key){
    int l = 0, h = arr.length-1, mid;
    while (l <= h )
    {
        mid = (l+h)/2;
        if(key == arr.A[mid])
            return mid;
        else if (key < arr.A[mid])
            h = mid-1;
        else
            l = mid +1;
    }
    return -1;
    
}

//! Reversing an array
// Method 0
void Reversed1(struct Array *arr){
    int *B, i, j;
    B = (int*)malloc(arr->length*sizeof(int));
    for( i = arr->length, j = 0; i >= 0; i--, j++){
        B[j] = arr->A[i];
    }
    for( i = 0; i < arr->length; i++){
        arr->A[i] = B[i];
    }
}

//Method 1
void Reversed2(struct Array *arr){
    for(int i = 0, j = arr->length-1; i<j; i++, j--)
        swapValues(&arr->A[i], &arr->A[j]);
}

//! Insert element in array
void InsertSort(struct Array *arr, int x){
    int i = arr->length-1;
    if(arr->length == arr->size)
        return ;
    while(i >= 0 && arr->A[i] > x){
        arr->A[i+1] = arr->A[i];
        i--;
    }
    arr->A[i+1] = x;
    arr->length ++;
}

//! checking if element is sorted or not
int isSorted(struct Array arr){
    for(int i = 0; i < arr.length; i++){
        if (arr.A[i] > arr.A[i+1])
            return 0;
        return 1;
    }
}

//! rearrange -ve and +ve elements inside array
void rearrange(struct Array *arr){
    int i = 0, j = arr->length-1;
    while(i < j){
        while(arr->A[i] < 0) i++;
        while(arr->A[i] >= 0) j--;
        if (i < j) swapValues(&arr->A[i], &arr->A[j]);
    }
}

int main(){
    struct Array arr = {{10, 20, 30, 40, 50}, 10, 5};
    
    Display(arr);
    printf("\n");

    printf("\n");
    AppendElement(&arr, 69);
    Display(arr);

    printf("\n\n");
    Insert(&arr, 4, 35);
    Display(arr);

    printf("\n\n");
    printf("The deleted element is: %d\n",DeleteElement(&arr, 4));
    Display(arr);

    printf("\n\nOn linear search");
    printf("\nThe searched one is at: %d", linearSearch(&arr , 50));

    printf("\n\nOn Binary search1");
    printf("\nThe bianry search is: %d",BinarySearch(arr, 50)+1); // +1 is for user interface

    printf("\n\n");
    Reversed1(&arr);
    Display(arr);
    return 0;
}
