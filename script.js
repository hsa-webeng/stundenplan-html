document.addEventListener('DOMContentLoaded', (event) => {
    const timetable = document.querySelector('.timetable');
    const subjects = document.querySelectorAll('.subject');
    const timetableCells = document.querySelectorAll('.timetable td');

    subjects.forEach(subject => {
        makeDraggable(subject);
    });

    timetableCells.forEach(cell => {
        cell.addEventListener('dragover', dragOver);
        cell.addEventListener('dragenter', dragEnter);
        cell.addEventListener('dragleave', dragLeave);
        cell.addEventListener('drop', dragDrop);
    });

    timetable.addEventListener('click', (event) => {
        const subjectElement = event.target.closest('.subject');
        if (subjectElement && !subjectElement.classList.contains('cloned')) {
            removeModule(subjectElement);
        }
    });

    let draggedSubject = null;

    function makeDraggable(subject) {
        subject.setAttribute('draggable', 'true');
        subject.addEventListener('dragstart', dragStart);
        subject.addEventListener('dragend', dragEnd);
    }

    function dragStart(event) {
        draggedSubject = this;
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', this.textContent);
        event.dataTransfer.setData('length', this.dataset.length);
        this.classList.add('dragging');
    }

    function dragEnd() {
        this.classList.remove('dragging');
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
        const subjectLength = parseFloat(event.dataTransfer.getData('length'));
        const startTime = getStartTimeFromCell(this);
        const endTime = calculateEndTime(startTime, subjectLength);

        if (isValidDropTarget(this, subjectLength)) {
            const newSubject = draggedSubject.cloneNode(true);
            newSubject.classList.add('dropped-subject');

            // Add time at the top if not already present
            if (!newSubject.querySelector('.time-span')) {
                const timeSpan = document.createElement('div');
                timeSpan.classList.add('time-span');
                timeSpan.textContent = `${startTime} - ${endTime}`;
                newSubject.insertBefore(timeSpan, newSubject.firstChild);
            } else {
                // Update time span if already present
                const timeSpan = newSubject.querySelector('.time-span');
                timeSpan.textContent = `${startTime} - ${endTime}`;
            }

            newSubject.dataset.startTime = startTime;
            newSubject.dataset.endTime = endTime;

            this.appendChild(newSubject);
            makeDraggable(newSubject);

            // Remove the original subject from its previous position
            const originalParentCell = draggedSubject.parentNode;
            if (originalParentCell !== this) {
                removeSubjectAndClones(originalParentCell, parseFloat(draggedSubject.dataset.length));
            }

            // Unblock the cells below the drop target according to the subject length for original subject
            let currentCell = this;
            for (let i = 1; i < subjectLength; i++) {
                currentCell = getNextCell(currentCell);
                if (currentCell) {
                    const clone = newSubject.cloneNode(true);
                    clone.classList.add('cloned');
                    clone.dataset.startTime = startTime;
                    clone.dataset.endTime = endTime;
                    currentCell.appendChild(clone);
                }
            }

            // Highlight the original subject
            highlightOriginal(newSubject);
        }

        this.classList.remove('hovered');
    }

    function isValidDropTarget(cell, length) {
        const cellIndex = Array.from(timetableCells).indexOf(cell);
        const colIndex = cellIndex % 7; // Assuming 7 days in a week for the timetable

        // Check if the cell is not in the first column (Time slots)
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
        const nextCellIndex = cellIndex + 7; // Assuming 7 days in a week for the timetable
        if (nextCellIndex < timetableCells.length) {
            return timetableCells[nextCellIndex];
        } else {
            return null;
        }
    }

    function getStartTimeFromCell(cell) {
        const row = cell.parentElement;
        const startTimeText = row.querySelector('td:first-child').textContent;
        return startTimeText.split(' ')[0]; // Get only the hour part
    }

    function calculateEndTime(startTime, length) {
        const [startHour] = startTime.split(' ').map(Number);
        const endHour = startHour + length;
        return `${endHour} Uhr`;
    }

    function highlightOriginal(subjectElement) {
        // Remove highlight from all subjects
        subjects.forEach(subject => {
            subject.classList.remove('highlighted');
        });

        // Add highlight to the original subject
        subjectElement.classList.add('highlighted');
    }

    function removeModule(subjectElement) {
        const parentCell = subjectElement.parentNode;
        parentCell.removeChild(subjectElement);

        // Unblock the cells when the subject is removed
        let currentCell = parentCell;
        const subjectLength = parseFloat(subjectElement.dataset.length);
        for (let i = 1; i < subjectLength; i++) {
            currentCell = getNextCell(currentCell);
            if (currentCell) {
                currentCell.classList.remove('blocked');
                const clonedElement = currentCell.querySelector('.cloned');
                if (clonedElement) {
                    currentCell.removeChild(clonedElement);
                }
            }
        }
    }

    function removeSubjectAndClones(cell, length) {
        let currentCell = cell;
        for (let i = 0; i < length; i++) {
            if (currentCell) {
                const subject = currentCell.querySelector('.dropped-subject, .cloned');
                if (subject) {
                    currentCell.removeChild(subject);
                    currentCell.classList.remove('blocked'); // Remove blocked class from clones
                }
                currentCell = getNextCell(currentCell);
            }
        }
    }
});
