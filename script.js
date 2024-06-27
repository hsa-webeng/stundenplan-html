document.addEventListener('DOMContentLoaded', (event) => {
    const subjects = document.querySelectorAll('.subject');
    const timetableCells = document.querySelectorAll('.timetable td');

    subjects.forEach(subject => {
        subject.setAttribute('draggable', 'true');
        subject.addEventListener('dragstart', dragStart);
        subject.addEventListener('dragend', dragEnd);
    });

    timetableCells.forEach(cell => {
        cell.addEventListener('dragover', dragOver);
        cell.addEventListener('dragenter', dragEnter);
        cell.addEventListener('dragleave', dragLeave);
        cell.addEventListener('drop', dragDrop);
    });

    let draggedSubject = null;

    function dragStart(event) {
        draggedSubject = this;
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', this.textContent);
        event.dataTransfer.setData('length', this.dataset.length);
        this.classList.add('dragging');
    }

    function dragEnd() {
        this.classList.remove('dragging');
        draggedSubject = null;
    }

    function dragOver(event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }

    function dragEnter(event) {
        event.preventDefault();
        this.classList.add('hovered');
    }

    function dragLeave() {
        this.classList.remove('hovered');
    }

    function dragDrop(event) {
        event.preventDefault();
        this.classList.remove('hovered');
        const subjectLength = parseFloat(event.dataTransfer.getData('length'));
        if (isValidDropTarget(this, subjectLength)) {
            const subjectData = event.dataTransfer.getData('text/plain');
            const newSubject = draggedSubject.cloneNode(true);
            newSubject.classList.add('dropped-subject');

          
            let currentCell = this;
            for (let i = 0; i < subjectLength; i++) {
                if (currentCell) {
                    if (i === 0) {
                        currentCell.appendChild(newSubject);
                        addRemoveButton(newSubject);
                    }
                    currentCell = getNextCell(currentCell);
                }
            }
        }
    }

    function isValidDropTarget(cell, length) {
        const cellIndex = Array.from(timetableCells).indexOf(cell);
        const colIndex = cellIndex % 7; // 0 = Montag, 1 = Dienstag, ..., 6 = Samstag

        // Check if the cell is not in the first column (Uhrzeit)
        if (colIndex === 0) {
            return false;
        }

        // Check if the cell has enough space for the subject
        let remainingLength = length;
        let currentCell = cell;
        while (remainingLength > 0 && currentCell) {
            if (!currentCell.classList.contains('blocked')) {
                remainingLength--;
            }
            currentCell = getNextCell(currentCell);
        }

        return remainingLength === 0;
    }

    function getNextCell(cell) {
        const cellIndex = Array.from(timetableCells).indexOf(cell);
        const nextCellIndex = cellIndex + 1;
        if (nextCellIndex < timetableCells.length) {
            return timetableCells[nextCellIndex];
        } else {
            return null;
        }
    }

    function addRemoveButton(subjectElement) {
        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'X';
        removeBtn.classList.add('remove-btn');
        removeBtn.addEventListener('click', () => {
            const parentCell = subjectElement.parentNode;
            parentCell.removeChild(subjectElement);
            parentCell.removeChild(removeBtn);
        });
        subjectElement.appendChild(removeBtn);
    }
});
