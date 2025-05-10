import { parseDate } from "@internationalized/date";
import {
  Button,
  Progress,
  Spacer,
  Checkbox,
  DateInput,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Spinner,
} from "@nextui-org/react";
import { ArrowLeft, Edit, Minus, Plus, Trash } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppContext } from "../AppProvider";
import Task from "../domain/Task";
import { TaskStatus } from "../domain/TaskStatus";

const TaskListScreen: React.FC = () => {
  const { state, api } = useAppContext();
  const { listId } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const taskList = state.taskLists.find((tl) => listId === tl.id);

  useEffect(() => {
    const loadInitialData = async () => {
      if (!listId) return;

      setIsLoading(true);
      try {
        if (!state.taskLists.find((tl) => tl.id === listId)) {
          await api.getTaskList(listId);
        }
        await api.fetchTasks(listId);
      } catch (error) {
        console.error("Error loading task list:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [listId, api]);

  const completionPercentage = React.useMemo(() => {
    if (listId && state.tasks[listId]) {
      const tasks = state.tasks[listId];
      const closeTaskCount = tasks.filter(
        (task) => task.status === TaskStatus.CLOSED
      ).length;
      return tasks.length > 0 ? (closeTaskCount / tasks.length) * 100 : 0;
    }
    return 0;
  }, [state.tasks, listId]);

  const toggleStatus = (task: Task) => {
    if (listId && task.id) {
      // Ensure task.id is defined
      const updatedTask = { ...task };
      updatedTask.status =
        task.status === TaskStatus.CLOSED ? TaskStatus.OPEN : TaskStatus.CLOSED;

      api
        .updateTask(listId, task.id, updatedTask) // task.id is guaranteed to be a string here
        .then(() => api.fetchTasks(listId));
    } else {
      console.error("Task ID or List ID is missing.");
    }
  };

  const deleteTaskList = async () => {
    if (listId) {
      try {
        await api.deleteTaskList(listId);
        navigate("/");
      } catch (error) {
        console.error("Failed to delete task list:", error);
        alert("Failed to delete the task list. Please try again.");
      }
    }
  };

  const tableRows = () => {
    if (listId && state.tasks[listId]) {
      return state.tasks[listId].map((task) => (
        <TableRow key={task.id} className="border-t">
          <TableCell className="px-4 py-2">
            <Checkbox
              isSelected={TaskStatus.CLOSED === task.status}
              onValueChange={() => toggleStatus(task)}
              aria-label={`Mark task "${task.title}" as ${
                TaskStatus.CLOSED === task.status ? "open" : "closed"
              }`}
            />
          </TableCell>
          <TableCell className="px-4 py-2">{task.title}</TableCell>
          <TableCell className="px-4 py-2">{task.priority}</TableCell>
          <TableCell className="px-4 py-2">
            {task.dueDate && (
              <DateInput
                isDisabled
                defaultValue={parseDate(
                  new Date(task.dueDate).toISOString().split("T")[0]
                )}
                aria-label={`Due date for task "${task.title}"`}
              />
            )}
          </TableCell>
          <TableCell className="px-4 py-2">
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                aria-label={`Edit task "${task.title}"`}
                onClick={() =>
                  navigate(`/task-lists/${listId}/edit-task/${task.id}`)
                }
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  if (task.id) {
                    api.deleteTask(listId, task.id); // Ensure task.id is defined
                  } else {
                    console.error("Task ID is missing.");
                  }
                }}
                aria-label={`Delete task "${task.title}"`}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          </TableCell>
        </TableRow>
      ));
    }
    return [];
  };

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex w-full items-center justify-between">
          <Button
            variant="ghost"
            aria-label="Go back to Task Lists"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <h1 className="text-2xl font-bold mx-4">
            {taskList ? taskList.title : "Unknown Task List"}
          </h1>

          <Button
            variant="ghost"
            aria-label={`Edit task list`}
            onClick={() => navigate(`/edit-task-list/${listId}`)}
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Progress
        value={completionPercentage}
        className="mb-4"
        aria-label="Task completion progress"
      />
      <Button
        onClick={() => navigate(`/task-lists/${listId}/new-task`)}
        aria-label="Add new task"
        className="mb-4 w-full"
      >
        <Plus className="h-4 w-4" /> Add Task
      </Button>
      <div className="border rounded-lg overflow-hidden">
        <Table className="w-full" aria-label="Tasks list">
          <TableHeader>
            <TableColumn>Completed</TableColumn>
            <TableColumn>Title</TableColumn>
            <TableColumn>Priority</TableColumn>
            <TableColumn>Due Date</TableColumn>
            <TableColumn>Actions</TableColumn>
          </TableHeader>
          <TableBody>{tableRows()}</TableBody>
        </Table>
      </div>
      <Spacer y={4} />
      <div className="flex justify-end">
        <Button
          color="danger"
          startContent={<Minus size={20} />}
          onClick={deleteTaskList}
          aria-label="Delete current task list"
        >
          Delete TaskList
        </Button>
      </div>

      <Spacer y={4} />
    </div>
  );
};

export default TaskListScreen;
