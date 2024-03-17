import math

a = 1
b = 1
c = 1
d = 1


def valid(a, b, c, d):
    matrix = [a, b, c, d]
    for i in range(len(matrix)-1):
        if (matrix[i] <= 0) or (matrix[i+1] <= 0):
            return False
        if matrix[i] >= matrix[i+1]:
            return False     
    if (d/c != c/b) or (c/b != b/a) or (d/c != b/a):
        return False
    if (a+b <= c) or (a+c <= b) or (b+c <= a) or (b+c <= d) or (b+d <= c) or (c+d <= b):
        return False
    return True

minValue = 0.1
maxValue = 8
stepValue = 0.01
solutionFound = False
def main():
    for a in range(int(minValue/stepValue), int(maxValue/stepValue)):
        #print(f"a value = {a}")
        for b in range(int((a + stepValue)/stepValue), int(maxValue/stepValue)):
            for c in range(int((b + stepValue)/stepValue), int(maxValue/stepValue)):
                for d in range(int((c + stepValue + 1)/stepValue), int((maxValue+1)/stepValue)):
                    print(a, b, c, d)
                    if valid(a, b, c, d):
                        solutionFound = True
                        print("\nSOLUTION FOUND")
                        print(f"Trialling: [{a}, {b}, {c}, {d}]")
                        print(d/a)
                        print("\n")
                        return
                    else:
                        pass
main()
if not solutionFound:
    print("No solutions were found.")

