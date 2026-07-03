// Array and Tree Construction Animation Script

class ArrayTreeAnimator {
    constructor() {
        this.arrayContainer = document.getElementById('arrayContainer');
        this.treeContainer = document.getElementById('treeContainer');
        this.startBtn = document.getElementById('startBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.statusElement = document.getElementById('status');
        
        this.data = [10, 20, 30, 40, 50, 60, 70]; // Sample data
        this.arrayElements = [];
        this.treeNodes = [];
        this.treeConnectors = [];
        this.isAnimating = false;
        this.currentStep = 0;
        
        this.init();
        this.bindEvents();
    }
    
    init() {
        this.resetAnimation();
    }
    
    bindEvents() {
        this.startBtn.addEventListener('click', () => this.startAnimation());
        this.resetBtn.addEventListener('click', () => this.resetAnimation());
    }
    
    resetAnimation() {
        if (this.isAnimating) return;
        
        this.isAnimating = false;
        this.currentStep = 0;
        this.statusElement.textContent = 'Ready to start';
        this.statusElement.style.color = '#ffd700';
        
        // Clear containers
        this.arrayContainer.innerHTML = '';
        this.treeContainer.innerHTML = '';
        
        // Clear arrays
        this.arrayElements = [];
        this.treeNodes = [];
        this.treeConnectors = [];
        
        // Create array elements
        this.data.forEach((value, index) => {
            const element = document.createElement('div');
            element.className = 'array-element';
            element.textContent = value;
            element.dataset.index = index;
            this.arrayContainer.appendChild(element);
            this.arrayElements.push(element);
        });
        
        // Initially show all array elements as inactive
        this.arrayElements.forEach(el => {
            el.classList.remove('active', 'processing', 'added');
        });
    }
    
    startAnimation() {
        if (this.isAnimating) return;
        
        this.isAnimating = true;
        this.statusElement.textContent = 'Starting animation...';
        this.statusElement.style.color = '#ff6b35';
        
        // Reset visual state
        this.arrayElements.forEach(el => {
            el.classList.remove('active', 'processing', 'added');
        });
        
        this.treeContainer.innerHTML = '';
        this.treeNodes = [];
        this.treeConnectors = [];
        
        // Start the animation sequence
        this.animateArrayStorage();
    }
    
    animateArrayStorage() {
        this.statusElement.textContent = 'Storing data in array...';
        this.statusElement.style.color = '#ff6b35';
        
        let index = 0;
        const interval = setInterval(() => {
            if (index < this.data.length) {
                // Highlight current element being processed
                this.arrayElements[index].classList.add('processing');
                
                // Small delay then mark as added
                setTimeout(() => {
                    this.arrayElements[index].classList.remove('processing');
                    this.arrayElements[index].classList.add('added');
                }, 300);
                
                index++;
            } else {
                clearInterval(interval);
                setTimeout(() => {
                    this.statusElement.textContent = 'Array storage complete! Building tree...';
                    this.statusElement.style.color = '#4CAF50';
                    this.animateTreeConstruction();
                }, 800);
            }
        }, 500);
    }
    
    animateTreeConstruction() {
        this.statusElement.textContent = 'Constructing binary tree from array...';
        this.statusElement.style.color = '#ff6b35';
        
        // Build tree level by level
        this.buildTreeLevelByLevel(0);
    }
    
    buildTreeLevelByLevel(startIndex) {
        const queue = [];
        let index = startIndex;
        
        // Add root node
        if (index < this.data.length) {
            this.createTreeNode(index, 0, 0);
            queue.push({ index: index, level: 0, position: 0 });
        }
        
        const processNext = () => {
            if (queue.length === 0) {
                setTimeout(() => {
                    this.statusElement.textContent = 'Tree construction complete!';
                    this.statusElement.style.color = '#4CAF50';
                    this.isAnimating = false;
                }, 1000);
                return;
            }
            
            const { index: currentIndex, level, position } = queue.shift();
            
            // Process left child
            const leftIndex = 2 * currentIndex + 1;
            if (leftIndex < this.data.length) {
                this.createTreeNode(leftIndex, level + 1, position * 2);
                queue.push({ index: leftIndex, level: level + 1, position: position * 2 });
            }
            
            // Process right child
            const rightIndex = 2 * currentIndex + 2;
            if (rightIndex < this.data.length) {
                this.createTreeNode(rightIndex, level + 1, position * 2 + 1);
                queue.push({ index: rightIndex, level: level + 1, position: position * 2 + 1 });
            }
            
            // Continue processing after a delay
            setTimeout(processNext, 400);
        };
        
        // Start processing
        setTimeout(processNext, 400);
    }
    
    createTreeNode(arrayIndex, level, position) {
        // Calculate position in the tree container
        const nodeSize = 50;
        const levelSpacing = 80;
        const nodeSpacing = 60;
        
        const x = 200 + (position - Math.pow(2, level - 1) + 0.5) * nodeSpacing;
        const y = 50 + level * levelSpacing;
        
        // Create node element
        const node = document.createElement('div');
        node.className = 'tree-node';
        node.textContent = this.data[arrayIndex];
        node.style.position = 'absolute';
        node.style.left = `${x}px`;
        node.style.top = `${y}px`;
        node.dataset.arrayIndex = arrayIndex;
        
        this.treeContainer.appendChild(node);
        this.treeNodes.push(node);
        
        // Animate the node
        node.classList.add('processing');
        setTimeout(() => {
            node.classList.remove('processing');
            node.classList.add('added');
        }, 300);
        
        // Create connector to parent (if not root)
        if (arrayIndex > 0) {
            const parentIndex = Math.floor((arrayIndex - 1) / 2);
            const parentNode = this.treeNodes[parentIndex];
            
            if (parentNode) {
                const connector = document.createElement('div');
                connector.className = 'tree-connector';
                connector.style.position = 'absolute';
                connector.style.background = '#ff6b35';
                
                // Calculate connector dimensions
                const parentRect = parentNode.getBoundingClientRect();
                const nodeRect = node.getBoundingClientRect();
                const containerRect = this.treeContainer.getBoundingClientRect();
                
                const parentX = parentRect.left - containerRect.left + parentRect.width / 2;
                const parentY = parentRect.top - containerRect.top + parentRect.height;
                const nodeX = nodeRect.left - containerRect.left + nodeRect.width / 2;
                const nodeY = nodeRect.top - containerRect.top;
                
                const length = Math.sqrt(Math.pow(nodeX - parentX, 2) + Math.pow(nodeY - parentY, 2));
                const angle = Math.atan2(nodeY - parentY, nodeX - parentX) * 180 / Math.PI;
                
                connector.style.width = `${length}px`;
                connector.style.height = '3px';
                connector.style.left = `${parentX}px`;
                connector.style.top = `${parentY}px`;
                connector.style.transform = `rotate(${angle}deg)`;
                connector.style.transformOrigin = '0 0';
                
                this.treeContainer.appendChild(connector);
                this.treeConnectors.push(connector);
                
                // Animate connector
                connector.style.opacity = '0';
                setTimeout(() => {
                    connector.style.transition = 'opacity 0.5s ease';
                    connector.style.opacity = '1';
                }, 100);
            }
        }
    }
}

// Initialize the animator when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.animator = new ArrayTreeAnimator();
});