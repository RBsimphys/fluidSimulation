# fluidSimulation
2D fluid simulation based on Lattice Boltzmann Method, implemented for the web!


# Lattice Boltzmann Fluid Simulation

This repository contains JavaScript code implementing a two-dimensional fluid simulation using the lattice Boltzmann method. The simulation is visualized on an HTML5 canvas element, providing a graphical representation of fluid dynamics within a grid-based system.

## Overview

The fluid simulation utilizes the lattice Boltzmann method, a computational technique widely used in fluid dynamics simulations. The code represents fluid properties such as density and velocity within individual cells of a grid. By simulating discrete time steps, the behavior of the fluid evolves over time according to collision and streaming processes.

## Features

- Interactive visualization of fluid dynamics on an HTML5 canvas.
- Ability to set obstacles of various shapes within the fluid domain.
- Adjustable parameters including Reynolds number and obstacle shapes.
- Educational tool for understanding fluid dynamics and the lattice Boltzmann method.

## Usage

To run the simulation, simply open the `index.html` file in a web browser that supports HTML5 canvas.


## TODO
- Refactor code for improved readability and maintainability.
- Implement shaders to optimize performance and enhance visual effects.
- Update GUI to provide more user-friendly controls, including the ability to animate obstacle radius changes.
- Clean color maps for better visualization and understanding of fluid properties.
- Integrate into blog

## References and adaptations

- Guo, Z., & Shu, C. (2013). Lattice Boltzmann Method and Its Applications in Engineering. *Advances in Computational Fluid Dynamics*, 420. [DOI](https://doi.org/10.1142/8806)
- Heavily relied on this course to understand and implement the algorithm: [Modeling and Simulation of Natural Processes](https://www.coursera.org/learn/modeling-simulation-natural-processes) on Coursera.
- To understand general concepts and other applications: [YouTube video](https://www.youtube.com/watch?v=JKQ0XdjLo7M&ab_channel=CyprienRusu).
- Utilized the Viridis color map based on Matplotlib: [Viridis Colormap](https://matplotlib.org/stable/users/explain/colors/colormaps.html).

## Authors

- [Rami Barakat] - [Barakat.Rami@outlook.com]

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
