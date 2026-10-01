# Overview

This is a browser-based decision tree that learns to identify iris flowers (setosa, versicolor, and virginica) from four measurements: sepal length, sepal width, petal length, and petal width. Everything is hand-written in vanilla JavaScript. Nothing about the tree itself comes from a library.

How it works: Gini impurity measures how "messy" a pile of flowers is, meaning how mixed up the species are in it, not just how many kinds but the proportions. `splitRows` carries out a yes/no question like "is petal_length less than 2.5?" and sorts the flowers into two piles based on the answer. `bestSplit` tries every possible question and keeps the one with the biggest gain, which is the messiness before the split minus the messiness after. `buildTree` finds the best question, splits the flowers, then calls itself on the left and right piles (recursion), stopping when a pile is pure or when it hits max depth 5. `predict` walks a new flower down the finished tree, going left or right at each question until it lands on a leaf, and the leaf's majority species is the answer.

To prove the tree actually learned something, the data gets shuffled (the CSV is grouped by species, so without shuffling the test would be rigged), 120 flowers are used for training, and 30 are held back for testing. The accuracy prints right on the page.

My purpose in writing this was to understand how a decision tree actually learns from the inside out instead of just calling a library function and trusting the magic.

[Software Demo Video](http://youtube.link.goes.here)

# Development Environment

* VS Code
* Vanilla JavaScript running in the browser, no build tools, just open index.html
* Papa Parse (loaded via CDN) for parsing the CSV
* Git and GitHub for version control

# Useful Websites

* [UCI Machine Learning Repository - Iris Dataset](https://archive.ics.uci.edu/dataset/53/iris) - where the flower data comes from

# Future Work

* Turn this into a true ML project by giving the model real adjustable weights that get tuned during training, so it can fine-tune itself to a dataset and learn to identify more kinds of flowers instead of just picking fixed split thresholds.
* Draw the actual tree on the page instead of only logging it to the console.
* Let the user type in their own flower measurements and get a prediction live.
