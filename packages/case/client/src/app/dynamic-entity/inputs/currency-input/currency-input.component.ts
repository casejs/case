import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild
} from '@angular/core'
import { PropertyDescription } from '~shared/interfaces/property-description.interface'

@Component({
  selector: 'app-currency-input',
  template: ` <label [for]="prop.propName">{{ prop.label }}</label>
    <p class="control has-icons-right">
      <input
        class="input"
        type="number"
        step="0.01"
        (change)="onChange($event)"
        #input
      />
      <span class="icon is-small is-right">
        <i class="icon icon-dollar-sign"></i>
      </span>
    </p>`,
  styleUrls: ['./currency-input.component.scss']
})
export class CurrencyInputComponent implements OnInit {
  @Input() prop: PropertyDescription
  @Output() valueChanged: EventEmitter<number> = new EventEmitter()

  @Input() value: string

  @ViewChild('input', { static: true }) input: ElementRef

  ngOnInit(): void {
    if (this.value !== undefined) {
      this.input.nativeElement.value = this.value
    }
  }

  onChange(event: any) {
    this.valueChanged.emit(event.target.value)
  }
}