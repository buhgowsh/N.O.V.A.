import os
import cv2
import time
import math
import numpy as np
import matplotlib.pyplot as plt
import matplotlib
# Use Agg backend which doesn't require a display
matplotlib.use('Agg')

face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_eye.xml')

def analyze_video(video_path, output_dir=None):
    """
    Analyze video for eye detection and save plot in the specified output directory.
    
    Parameters:
    - video_path: Path to the video file
    - output_dir: Directory where the plot should be saved (defaults to video's directory)
    
    Returns:
    - Dictionary with plot path and statistics
    """
    # If no output directory is specified, use the video's directory
    if output_dir is None:
        output_dir = os.path.dirname(video_path)
    
    # Ensure the output directory exists
    os.makedirs(output_dir, exist_ok=True)
    print("Make dirs")
    cap = cv2.VideoCapture(video_path)
    past = time.time()
    timeh = []
    print("capture video")

    while True:
        ret, frame = cap.read()
        print("capture read")
        if not ret:
            break

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.3, minNeighbors=5)
        eyes = []
        print("analyze face")

        for (x, y, w, h) in faces:
            cv2.rectangle(frame, (x, y), (x + w, y + h), (255, 0, 0), 2)
            roi_gray = gray[y:y + h, x:x + w]
            roi_color = frame[y:y + h, x:x + w]
            eyes = eye_cascade.detectMultiScale(roi_gray, scaleFactor=1.1, minNeighbors=10)
            for (ex, ey, ew, eh) in eyes:
                cv2.rectangle(roi_color, (ex, ey), (ex + ew, ey + eh), (0, 255, 0), 2)

        print("math calculated")
        
        if len(eyes) > 0:
            timeh.append(1)
        else:
            timeh.append(0)

        print("time")

        #cv2.imshow('Eye Detection', frame)
        #if cv2.waitKey(1) & 0xFF == ord('q'):
            # break

    curr = time.time()
    totTime = int(math.floor(curr - past))
    
    binSize = len(timeh) // (totTime * 2)
    if binSize == 0:  # Protect against division by zero
        binSize = 1
        
    binRem = len(timeh) % (totTime * 2)
    totSize = len(timeh) - binRem

    data = []
    sum1 = 0
    y = .5
    for x in range(min(totSize + 1, len(timeh))):
        if x % binSize == 0 and x != 0:
            data.append([y, sum1 / binSize])
            sum1 = 0
            y += .5
        sum1 += timeh[x]
    
    # If we have any remaining data to process
    if sum1 > 0 and binSize > 0:
        data.append([y, sum1 / binSize])

    # Save the plot in the specified output directory
    plot_filename = "eye_tracking_plot.png"
    plot_save_path = os.path.join(output_dir, plot_filename)
    stats = analyze_data(data, y_min=-0.1, y_max=1.1, title="Eye Tracking Analysis", save_path=plot_save_path)
    
    cap.release()
    cv2.destroyAllWindows()
    print("Exiting API")

    # Return both the image path and the stats
    return {
        "plot_path": plot_save_path,
        "plot_filename": plot_filename,
        "stats": stats
    }

def analyze_data(data, y_min=0, y_max=1, title="Data Analysis", window_size=None, save_path=None):
    """
    Analyze and plot data with a trend line and moving average.
    
    Parameters:
    - data: List of [x, y] points
    - y_min, y_max: Fixed y-axis limits
    - title: Plot title
    - window_size: Size of moving average window (defaults to ~10% of data points)
    - save_path: Path to save the plot image
    """
    if not data:
        print("No data to analyze")
        return {
            "error": "No data to analyze"
        }

    # Extract x and y values
    x = [point[0] for point in data]
    y = [point[1] for point in data]

    # Set default window size if not provided
    if window_size is None:
        window_size = max(3, len(data) // 10)  # Default to ~10% of data points, minimum 3

    # Calculate trend line
    z = np.polyfit(x, y, 1)
    p = np.poly1d(z)

    # create the plot
    plt.figure(figsize=(12, 6))  # Create a large figure for better visibility

    # Plot data points with connecting lines
    plt.plot(x, y, 'bo-', markersize=4, alpha=0.5, label='Raw data')

    # Plot trend line
    x_line = np.linspace(min(x), max(x), 1000)
    plt.plot(x_line, p(x_line), 'r--', linewidth=2.0, label=f'Trend line: y={z[0]:.4f}x + {z[1]:.4f}')

    # Calculate moving average if we have enough data points
    if len(y) > window_size:
        moving_avg = []
        for i in range(len(y) - window_size + 1):
            window_avg = sum(y[i:i+window_size]) / window_size
            moving_avg.append(window_avg)

        moving_avg_x = x[window_size-1:][:len(moving_avg)]
        plt.plot(moving_avg_x, moving_avg, 'g-', linewidth=2.0,
                 label=f'Moving avg (window={window_size})')

    # Add grid for better readability
    plt.grid(True, linestyle='--', alpha=0.7)

    # Set the plot and limits
    x_padding = (max(x) - min(x)) * 0.05  # 5% padding on each side
    plt.xlim(min(x) - x_padding, max(x) + x_padding)
    plt.ylim(y_min, y_max)

    # Add labels, title, and legend
    plt.xlabel('Time (seconds)')
    plt.ylabel('Eye Detection Score')
    plt.title(title)
    plt.legend()

    # Improve visual appearance
    plt.tight_layout()  # Adjust the layout
    
    # Save the plot to the specified path instead of showing it
    if save_path:
        plt.savefig(save_path, dpi=100, bbox_inches='tight')
        print(f"Plot saved to: {save_path}")
    
    # Close the plot to free memory
    plt.close()

    # Calculate statistics
    avg_y = sum(y) / len(y)
    stats = {
        "slope": float(z[0]),
        "intercept": float(z[1]),
        "average_y": float(avg_y),
        "x_range": (float(min(x)), float(max(x))),
        "y_range": (float(min(y)), float(max(y))),
        "data_count": len(data)
    }
    
    # Print the statistics for debugging
    print(f"Trend line equation: y = {z[0]:.6f}x + {z[1]:.6f}")
    print(f"Average y-value: {avg_y:.6f}")
    print(f"Data range: x from {min(x):.2f} to {max(x):.2f}, y from {min(y):.2f} to {max(y):.2f}")
    print(f"Number of data points: {len(data)}")

    return stats

def pie_chart(data, save_path=None):
    plt.style.use('_mpl-gallery-nogrid')

    payingAttention = 0
    notPayingAttention = 0

    for point in data:
        if point[1] <= 0.5:
            payingAttention += 1
        else:
            notPayingAttention += 1

    # make data
    x = [payingAttention, notPayingAttention]
    labels = ['Paying Attention', 'Not Paying Attention']
    colors = plt.get_cmap('Blues')(np.linspace(0.2, 0.7, len(x)))

    # plot
    fig, ax = plt.subplots()
    ax.pie(x, colors=colors, radius=3, center=(4, 4),
        wedgeprops={"linewidth": 1, "edgecolor": "white"}, frame=True, autopct='%1.1f%%', labels=labels)

    plt.xticks([])
    plt.yticks([])

    plt.legend()

    plt.tight_layout()

    # Save the pie chart if a path is provided
    if save_path:
        plt.savefig(save_path, dpi=100, bbox_inches='tight')
        print(f"Pie chart saved to: {save_path}")
        plt.close()
    else:
        plt.show()